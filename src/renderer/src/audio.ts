export const audio = new Audio()
audio.preload = 'auto'
audio.crossOrigin = 'anonymous'

type Graph = { context: AudioContext; analyser: AnalyserNode; gain: GainNode }

const VOLUME_RANGE_DB = 60

export const gainFor = (level: number): number =>
  level <= 0 ? 0 : 10 ** ((VOLUME_RANGE_DB * (Math.min(1, level) - 1)) / 20)

export const levelFor = (gain: number): number =>
  gain <= 0 ? 0 : Math.min(1, Math.max(0, 1 + (20 * Math.log10(gain)) / VOLUME_RANGE_DB))

let graph: Graph | null = null
let output = { volume: 1, muted: false }

const applyOutput = (): void => {
  if (graph) {
    audio.volume = 1
    audio.muted = false
    graph.gain.gain.value = output.muted ? 0 : gainFor(output.volume)
  } else {
    audio.volume = output.muted ? 0 : gainFor(output.volume)
    audio.muted = false
  }
}

export const setOutput = (volume: number, muted: boolean): void => {
  output = { volume, muted }
  applyOutput()
}

export const getAnalyser = (): AnalyserNode => {
  if (!graph) {
    const context = new AudioContext()
    const source = context.createMediaElementSource(audio)
    const analyser = context.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.3
    const gain = context.createGain()
    source.connect(analyser).connect(gain).connect(context.destination)
    graph = { context, analyser, gain }
    applyOutput()
  }
  if (graph.context.state === 'suspended') void graph.context.resume()
  return graph.analyser
}

export const existingAnalyser = (): AnalyserNode | null => graph?.analyser ?? null
