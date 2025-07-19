import crypto from "crypto-js"

const KEY = "WJoZv1QWI4uq9f18"
export function getIdApiMatch(modelId: string) {
  function decode(data: crypto.lib.WordArray | string, key: string) {
    const _0x3b4ff1 = crypto.enc.Utf8.parse(key)
    const _0x25b00b = crypto.enc.Utf8.parse(key.substring(0x0, 0x10))
    const _0x55bc8a = crypto.AES.encrypt(data, _0x3b4ff1, {
      iv: _0x25b00b,
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7
    })
    return _0x55bc8a
      .toString()
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  return decode(modelId, KEY)
}
