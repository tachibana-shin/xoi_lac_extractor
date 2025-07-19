import cryptoJS from "crypto-js"
import { data_api, siteId } from "../constants"

function decode(encryptedBase64: string, rawKey: string) {
  const keyHash = cryptoJS.SHA256(rawKey)

  const ivHex = cryptoJS
    .SHA256(keyHash + "_iv")
    .toString(cryptoJS.enc.Hex)
    .slice(0, 32) // 16 byte = 32 hex chars

  const iv = cryptoJS.enc.Hex.parse(ivHex)

  const decrypted = cryptoJS.AES.decrypt(encryptedBase64, keyHash, {
    iv,
    mode: cryptoJS.mode.CBC,
    padding: cryptoJS.pad.Pkcs7
  })

  return decrypted.toString(cryptoJS.enc.Utf8)
}
export async function loadStreamList(
  id1: string,
  id2: string,
  id3: string,
  encoded: string
) {
  let data = decode(encoded, `${id2}${id1}${id3}`)

  data = decodeURIComponent(atob([...data].reverse().join("")))

  const parts = data.split(".")

  const res = await fetch(new URL(decode(parts[0]!, parts[3]!), data_api), {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "vi,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
      "cache-control": "no-cache",
      origin: "https://r.xoilac9.fun",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://r.xoilac9.fun/",
      "sec-ch-ua":
        '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-fetch-storage-access": "active",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"
    }
  }).then(async (res) =>
    res.ok ? (res.json() as Promise<any>) : Promise.reject(await res.text())
  )

  console.log(res)

  let encryptedPayload = res.data

  const keys = decode(parts[1]!, parts[2]!).split(".")

  console.log(keys)

  async function decrypt(encryptedPayload: string, keys: string[]) {
    const encryptedBytes = Uint8Array.from(atob(encryptedPayload), (char) =>
      char.charCodeAt(0)
    )

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const tag = encryptedBytes.slice(-16)
        const cipherText = encryptedBytes.slice(0, -16)

        const keyStr = attempt === 0 ? keys[0]! : keys[1]!
        const ivSeed = attempt === 0 ? keys[2]! : keys[3]!

        const aesKey = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(keyStr),
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        )

        const iv = Uint8Array.from(
          new Array(12)
            .fill(0)
            .map(
              (_, i) =>
                (parseInt(ivSeed) * parseInt(i + "12") * 0x11 + 0x17) % 256
            )
        )

        const fullCipher = new Uint8Array(cipherText.length + tag.length)
        fullCipher.set(cipherText)
        fullCipher.set(tag, cipherText.length)

        const plainBuffer = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          aesKey,
          fullCipher
        )

        const decoded = new TextDecoder().decode(plainBuffer)
        try {
          return JSON.parse(decoded)
        } catch {
          return decoded
        }
      } catch (e) {
        console.error("Decryption failed:", e)
      }
    }

    return null
  }

  const decrypted = await decrypt(encryptedPayload, keys)

  if (decrypted?.length) {
    const value = decrypted.map((match: any) => {
      let nameSub = ""
      let nameFormatted = ""

      if (match.blv?.length) {
        if (match.blv.length === 1) {
          nameSub = match.blv[0].name
          nameFormatted = match.blv[0].name
        } else if (match.blv.length === 2) {
          nameSub = `${match.blv[0].name} + ${match.blv[1].name}`
          nameFormatted = `${match.blv[0].name.replace(
            "Người ",
            ""
          )} + ${match.blv[1].name.replace("Người ", "")}`
        } else {
          nameSub =
            match.blv.map((b: any) => b.name).join(" + ") +
            ` + ${match.blv.length - 2} BLV`
          nameFormatted =
            match.blv
              .map((b: any) => b.name.replace("Người ", ""))
              .join(" + ") + ` + ${match.blv.length - 2} BLV`
        }
      }

      nameSub =
        nameSub && nameSub !== match.name
          ? ` <small>(${nameFormatted})</small>`
          : ""

      const streamLinks = (match.stream_links || []).map(
        (link: any, i: number) => {
          if (["tvstation", "redirect"].includes(link.cdn)) {
            return {
              index: 9999,
              id: link.id,
              name: link.name,
              url: `/goto?url=${encodeURIComponent(link.url)}`,
              type: "redirect"
            }
          } else if (
            ["tvstation_bkgo"].includes(link.cdn) &&
            siteId === "banhkhuc"
          ) {
            return {
              index: i + 1,
              id: link.id,
              name: link.name,
              url: link.url,
              type: "link"
            }
          } else {
            return {
              index: i + 1,
              id: link.id,
              name: link.name,
              url: link.url,
              type: "link"
            }
          }
        }
      )

      return {
        id: match.id,
        name: match.name,
        name_sub: nameSub,
        blv: match.blv,
        chatroom: match.chatroom,
        stream_link_default: match.stream_link_default,
        avatar: match.blv?.length ? match.blv[0].avatar : "/images/nhadai.jpg",
        stream_links: streamLinks
      }
    })

    return value as {
      id?: string
      name: string
      name_sub: string
      blv?: string
      chatroom: string
      stream_link_default: null | string
      avatar: string
      stream_links: {
        index: number
        id: string
        name: string
        url: string
        type: "redirect" | "link"
      }[]
    }[]
  }

  return []
}
