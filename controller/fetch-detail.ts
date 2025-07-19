import { host_name } from "../constants.ts"
import { getIdApiMatch } from "../logic/get-id-api-match.ts"

export interface Detail {
  status: number
  data: {
    id: string
    key_sync: string
    timestamp: number
    sport_type: string
    date: string
    name: string
    slug: string
    title: string
    date_txt: string
    is_featured: number
    is_hot: number
    redirect_url: null
    img_banner: null
    home: {
      name: string
      logo: string
    }
    away: {
      name: string
      logo: string
    }
    tournament: {
      id: string
      name: string
      logo: string
      is_featured: number
      priority: number
    }
    scores: {
      home: number
      away: number
    }
    match_status: string
    home_red_cards: number
    away_red_cards: number
    thumbnail_url: string
    fansites: {
      id: string
      name: string
      blv: {
        name: string
        avatar: string
      }[]
      chatroom: string
      stream_links: number
    }[]
    checksum: string
    pos: string
    venue: {
      id: string
      name: string
      logo: null
    }
    referee: {
      id: string
      name: string
    }
  }
}

export async function fetchDetail(modelId: string) {
  const data = await fetch(
    `https://br.vebo.xyz/api/match/vb-detail/${host_name}/${getIdApiMatch(
      modelId
    )}`
  ).then(async (res) =>
    res.ok ? res.json() : Promise.reject(await res.text())
  )

  return( data as Detail).data
}
