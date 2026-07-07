export const PRAISE = [
  'That counted. It all counts.',
  'Look at you go. 🎉',
  'Your brain did a thing!',
  'Tiny steps are still steps.',
  'One thing at a time — and you did the thing.',
  'Done is done. Nobody can take that away.',
  'Past-you would be so relieved right now.',
  'That was real work. It goes on the wall.',
]

export const START_NUDGES = [
  'Starting is the win. You can stop anytime.',
  'One thing only. Everything else can wait.',
  'It doesn’t have to be perfect, it has to be started.',
  'Future-you says thanks in advance.',
  'Messy counts. Slow counts. Doing it counts.',
]

export const BREAK_IDEAS = [
  '💧 Drink some water',
  '🤸 Stretch your arms way up',
  '🪟 Look at something far away',
  '🚶 Walk one little loop',
  '🌬️ Three slow breaths',
  '🎶 One song, dancing optional',
  '🍎 Grab a snack',
]

export const STOP_NOTES = [
  'Those minutes count. They’re banked.',
  'Stopping on purpose is a skill. Nicely done.',
  'You showed up. That’s the hard part.',
  'The task will wait. Your minutes are saved.',
]

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Gentle two-tone chime via WebAudio — no audio file needed.
export function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const play = (freq, when, dur) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + when)
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + when + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + when)
      osc.stop(ctx.currentTime + when + dur + 0.05)
    }
    play(660, 0, 0.5)
    play(880, 0.25, 0.7)
    setTimeout(() => ctx.close(), 1500)
  } catch {
    // no audio available — that's fine
  }
  navigator.vibrate?.(200)
}
