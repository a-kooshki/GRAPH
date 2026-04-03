const form = document.getElementById("createRoomForm");
const statusText = document.getElementById("statusText");

function setStatus(message, type = "") {
  statusText.textContent = message;
  statusText.className = type;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function deriveRoomKey(password, roomCode) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveKey"
  ]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(`graph-room-${roomCode}`),
      iterations: 600_000,
      hash: "SHA-256"
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "خطا در ارتباط با سرور");
  }
  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const ownerName = String(formData.get("ownerName") || "").trim();
  const roomTitle = String(formData.get("roomTitle") || "").trim();
  const roomPassword = String(formData.get("roomPassword") || "").trim();
  const accessCode = String(formData.get("accessCode") || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (roomPassword.length < 8) {
    setStatus("رمز روم باید حداقل ۸ کاراکتر باشد.", "status-error");
    return;
  }
  if (accessCode.length !== 4) {
    setStatus("کد دسترسی ۴ رقمی معتبر نیست.", "status-error");
    return;
  }

  try {
    setStatus("در حال ساخت روم...");
    const data = await api("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ ownerName, roomTitle, roomPassword, accessCode })
    });
    setStatus("روم ساخته شد. در حال ورود...");
    const joinData = await api("/api/rooms/join", {
      method: "POST",
      body: JSON.stringify({
        userName: ownerName,
        roomCode: data.room.code,
        roomPassword
      })
    });
    const roomKey = await deriveRoomKey(roomPassword, data.room.code);

    sessionStorage.setItem(
      "meetingSession",
      JSON.stringify({
        roomCode: data.room.code,
        userName: ownerName,
        authToken: joinData.authToken,
        participantSessionId: joinData.participant?.sessionId,
        isOwner: Boolean(joinData.permissions?.isOwner),
        roomKey
      })
    );
    setStatus(`روم ساخته شد. کد روم: ${data.room.code}`, "status-success");
    window.location.href = `/room.html?code=${encodeURIComponent(data.room.code)}`;
  } catch (error) {
    setStatus(error.message, "status-error");
  }
});
