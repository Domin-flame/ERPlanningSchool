import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  http,
  refreshAccessToken,
} from "../api/client.js";

let mock;

beforeEach(() => {
  localStorage.clear();
  mock = new MockAdapter(http);
});

afterEach(() => {
  mock.restore();
  vi.restoreAllMocks();
});

describe("client API — refresh JWT", () => {
  it("ajoute le token d'accès aux requêtes", async () => {
    localStorage.setItem(TOKEN_KEY, "access-1");
    mock.onGet("/ping").reply(200, {});

    await http.get("/ping");

    expect(mock.history.get[0].headers.Authorization).toBe("Bearer access-1");
  });

  it("rafraîchit une seule fois pour plusieurs 401 simultanés puis rejoue les requêtes", async () => {
    localStorage.setItem(TOKEN_KEY, "expired");
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh-1");
    mock.onGet(/\/data\/\d/).reply((config) =>
      config.headers.Authorization === "Bearer access-2" ? [200, { ok: true }] : [401, {}]
    );
    mock.onPost("/auth/refresh").reply(200, { access_token: "access-2", refresh_token: "refresh-2" });
    const refreshed = vi.fn();
    window.addEventListener("cw:token-refreshed", refreshed);

    const responses = await Promise.all([http.get("/data/1"), http.get("/data/2"), http.get("/data/3")]);

    window.removeEventListener("cw:token-refreshed", refreshed);
    expect(responses.every((response) => response.data.ok)).toBe(true);
    expect(mock.history.post).toHaveLength(1);
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ refresh_token: "refresh-1" });
    expect(localStorage.getItem(TOKEN_KEY)).toBe("access-2");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh-2");
    expect(refreshed).toHaveBeenCalledTimes(1);
  });

  it("vide la session et émet cw:unauthorized si le refresh échoue", async () => {
    localStorage.setItem(TOKEN_KEY, "expired");
    localStorage.setItem(REFRESH_TOKEN_KEY, "revoked");
    mock.onGet("/data").reply(401, {});
    mock.onPost("/auth/refresh").reply(401, { detail: "Refresh token invalide" });
    const unauthorized = vi.fn();
    window.addEventListener("cw:unauthorized", unauthorized);

    await expect(http.get("/data")).rejects.toMatchObject({ response: { status: 401 } });

    window.removeEventListener("cw:unauthorized", unauthorized);
    expect(unauthorized).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it("ne tente pas de refresh pour un échec de connexion", async () => {
    mock.onPost("/auth/login").reply(401, { detail: "Identifiants invalides" });

    await expect(http.post("/auth/login", {})).rejects.toMatchObject({ response: { status: 401 } });
    expect(mock.history.post).toHaveLength(1);
  });

  it("rejette refreshAccessToken sans refresh token", async () => {
    await expect(refreshAccessToken()).rejects.toThrow();
    expect(mock.history.post).toHaveLength(0);
  });
});
