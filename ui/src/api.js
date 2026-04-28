const rawBase = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

function authHeaders() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function hasToken() {
  const token = localStorage.getItem("token") || "";
  return !!token;
}

async function request(path, options = {}, needsAuth = false) {
  const url = `${API_BASE}${path}`;
  const opts = { ...options };
  opts.headers = {
    "Content-Type": "application/json",
    ...(needsAuth ? authHeaders() : {}),
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    return { status: false, error: "network_error" };
  }

  if (res.status === 401 && needsAuth) {
    const email = localStorage.getItem("email") || "";
    const rt = localStorage.getItem("refreshToken") || "";
    if (email && rt) {
      const rr = await request("/user/refresh", {
        method: "POST",
        body: JSON.stringify({ email, refreshToken: rt })
      }, false);
      if (rr?.status && rr.token) {
        localStorage.setItem("token", rr.token);
        opts.headers = { ...opts.headers, ...authHeaders() };
        res = await fetch(url, opts);
      }
    }
  }

  try {
    return await res.json();
  } catch {
    return { status: false };
  }
}

export async function login(email, password) {
  return request("/user/login", { method: "POST", body: JSON.stringify({ email, password, status: 1 }) });
}

export async function register(username, email, password, plan = "Free", referredBy = "") {
  return request("/user/save", { method: "POST", body: JSON.stringify({ username, email, password, plan, referredBy }) });
}

export async function createOrder(userId, amount) {
  return request("/payment/order", { method: "POST", body: JSON.stringify({ userId, amount, currency: "INR", planTarget: "Premium" }) });
}

export async function verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
  return request("/payment/verify", {
    method: "POST",
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
  });
}

export async function runtimeValidate(payload) {
  return request("/runtime/validate", { method: "POST", body: JSON.stringify(payload) });
}

export async function fetchLicences() {
  if (!hasToken()) return { status: true, info: [] };
  return request("/licence/fetch-mine", {}, true);
}

export async function fetchRuntimeSessions() {
  if (!hasToken()) return { status: true, info: [] };
  return request("/licence/fetch-mine", {}, true);
}

export async function fetchApplications() {
  if (!hasToken()) return { status: true, info: [] };
  return request("/application/fetch-mine", {}, true);
}

export async function createApplication(appName, description) {
  return request("/application/save", { method: "POST", body: JSON.stringify({ appName, description }) }, true);
}

export async function updateApplicationVersion(appId, version) {
  const condition_obj = JSON.stringify({ _id: Number(appId) });
  const content_obj = JSON.stringify({ version });
  return request("/application/update", { method: "PATCH", body: JSON.stringify({ condition_obj, content_obj }) }, true);
}

export async function deleteApplication(appId) {
  const condition_obj = JSON.stringify({ _id: Number(appId) });
  return request("/application/delete", { method: "DELETE", body: JSON.stringify({ condition_obj }) }, true);
}

export async function resetApplicationSecret(appId) {
  return request("/application/reset-secret", { method: "POST", body: JSON.stringify({ appId: Number(appId) }) }, true);
}

export async function updateApplicationPayload(appId, remotePayload) {
  return request("/application/update-payload", { method: "PATCH", body: JSON.stringify({ appId: Number(appId), remotePayload }) }, true);
}

export async function createWebhook(appId, url, events) {
  return request("/webhook/create", { method: "POST", body: JSON.stringify({ appId: Number(appId), url, events }) }, true);
}

export async function fetchWebhooks(appId) {
  return request(`/webhook/list?appId=${appId}`, {}, true);
}

export async function deleteWebhook(id) {
  return request("/webhook/delete", { method: "DELETE", body: JSON.stringify({ id }) }, true);
}

export async function createLicenceKey(key, Day, appId, features = {}) {
  return request("/licence/save", { method: "POST", body: JSON.stringify({ key, Day, appId, features }) }, true);
}

export async function banUnbanLicence(licenceKey, appId, action) {
  return request("/licence/ban-unban", { method: "POST", body: JSON.stringify({ licenceKey, appId, action }) }, true);
}

export async function updateLicenceDays(licenceKey, appId, days) {
  const condition_obj = JSON.stringify({ key: licenceKey, appId: Number(appId) });
  const content_obj = JSON.stringify({ Day: Number(days) });
  return request("/licence/update", { method: "PATCH", body: JSON.stringify({ condition_obj, content_obj }) }, true);
}

export async function deleteLicence(licenceKey, appId) {
  const condition_obj = JSON.stringify({ key: licenceKey, appId: Number(appId) });
  return request("/licence/delete", { method: "DELETE", body: JSON.stringify({ condition_obj }) }, true);
}

export async function runExpiryCheck() {
  return request("/auth/expiry-check", { method: "POST" });
}

export async function resetHwid(licenceKey, appId) {
  return request("/licence/reset-hwid", { method: "POST", body: JSON.stringify({ licenceKey, appId }) }, true);
}

export async function setOffline(key) {
  return request("/auth/offline", { method: "POST", body: JSON.stringify({ key }) });
}

export async function resendVerify(email) {
  return request("/user/resend-verify", { method: "POST", body: JSON.stringify({ email }) });
}

export async function googleLogin(idToken) {
  return request("/user/google-login", { method: "POST", body: JSON.stringify({ idToken }) });
}

export async function forgotPassword(email) {
  return request("/user/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetPassword(email, token, password) {
  return request("/user/reset-password", { method: "POST", body: JSON.stringify({ email, token, password }) });
}

export async function logout() {
  return request("/user/logout", { method: "POST" }, true);
}

export async function updateProfileAvatar(email, avatarBase64) {
  const condition_obj = JSON.stringify({ email: email });
  const content_obj = JSON.stringify({ avatar: avatarBase64 });
  return request("/user/update", { method: "PATCH", body: JSON.stringify({ condition_obj, content_obj }) }, true);
}

export async function refreshToken(email, refreshToken) {
  return request("/user/refresh", {
    method: "POST",
    body: JSON.stringify({ email, refreshToken })
  }, false);
}

export async function fetchAdminStats() {
  return request("/user/admin/stats", {}, true);
}

export async function updateProfile(formData) {
  // Use raw fetch for multipart/form-data
  const token = localStorage.getItem("token") || "";
  return fetch(`${API_BASE}/user/update-profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }).then(r => r.json());
}

export async function fetchSessions() {
  return request("/user/sessions", {}, true);
}

export async function logoutDevice(sessionId) {
  return request("/user/logout-device", { method: "POST", body: JSON.stringify({ sessionId }) }, true);
}

export async function changePassword(payload) {
  return request("/user/change-password", { method: "POST", body: JSON.stringify(payload) }, true);
}

export async function fetchPayments() {
  return request("/payment/fetch-mine", {}, true);
}
