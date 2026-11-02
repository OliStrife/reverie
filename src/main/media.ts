import { app, nativeImage, net, protocol } from 'electron'
import { createReadStream, mkdirSync, writeFileSync } from 'fs'
import { stat } from 'fs/promises'
import { extname, join } from 'path'
import { Readable } from 'stream'
import { pathToFileURL } from 'url'
import { COVER_ID } from '../shared/playlists'

const SCHEME = 'media'
const SONG_COVER_SIZE = 600
const ID = COVER_ID

const AUDIO_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav'
}

export const coversDir = (): string => join(app.getPath('userData'), 'covers')
export const playlistCoversDir = (): string => join(app.getPath('userData'), 'playlist-covers')

export const registerMediaScheme = (): void => {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true
      }
    }
  ])
}

const body = (path: string, range?: { start: number; end: number }): BodyInit =>
  Readable.toWeb(createReadStream(path, range)) as unknown as BodyInit

const streamFile = async (path: string, request: Request): Promise<Response> => {
  const { size } = await stat(path)
  const headers = {
    'Content-Type': AUDIO_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes'
  }
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '')
  if (!range || (!range[1] && !range[2])) {
    return new Response(body(path), {
      status: 200,
      headers: { ...headers, 'Content-Length': String(size) }
    })
  }
  const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
  const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
  if (start > end || start >= size) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  }
  return new Response(body(path, { start, end }), {
    status: 206,
    headers: {
      ...headers,
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${size}`
    }
  })
}

const withCors = (response: Response): Response => {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export const handleMediaRequests = (trackPath: (id: string) => string | undefined): void => {
  protocol.handle(SCHEME, async (request) => withCors(await respond(request, trackPath)))
}

const respond = async (
  request: Request,
  trackPath: (id: string) => string | undefined
): Promise<Response> => {
  const url = new URL(request.url)
  const id = url.pathname.slice(1)
  if (!ID.test(id)) return new Response(null, { status: 404 })

  if (url.host === 'track') {
    const path = trackPath(id)
    if (!path) return new Response(null, { status: 404 })
    try {
      return await streamFile(path, request)
    } catch {
      return new Response(null, { status: 404 })
    }
  }

  const dir =
    url.host === 'cover' ? coversDir() : url.host === 'playlist-cover' ? playlistCoversDir() : null
  if (!dir) return new Response(null, { status: 404 })
  try {
    return await net.fetch(pathToFileURL(join(dir, `${id}.jpg`)).toString())
  } catch {
    return new Response(null, { status: 404 })
  }
}

export const saveSongCover = (id: string, data: Uint8Array): void => {
  try {
    mkdirSync(coversDir(), { recursive: true })
    const image = nativeImage.createFromBuffer(Buffer.from(data))
    const file = join(coversDir(), `${id}.jpg`)
    if (image.isEmpty()) {
      writeFileSync(file, data)
      return
    }
    const resized =
      image.getSize().width > SONG_COVER_SIZE
        ? image.resize({ width: SONG_COVER_SIZE, quality: 'best' })
        : image
    writeFileSync(file, resized.toJPEG(86))
  } catch (error) {
    console.error('Could not save a cover', error)
  }
}
