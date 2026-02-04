export type Mode = 'normal' | 'correction'

export type PointAction = { type: 'Point'; actor: 'R' | 'B'; points: 1 | 2 | 4 }
export type PassivityAction = { type: 'Passivity'; actor: 'R' | 'B' }
export type CautionAction = { type: 'Caution'; actor: 'R' | 'B'; awardedTo: 'R' | 'B'; points: 1 | 2 }
export type InjuryToggleAction = { type: 'InjuryToggle'; actor: 'R' | 'B'; blood: boolean }
export type ToggleBoutTimeAction = { type: 'ToggleBoutTime' }
export type BufferClearedAction = { type: 'BufferCleared' }
export type DeleteEventAction = { type: 'DeleteEvent' }
export type ConfirmAction = { type: 'Confirm' }
export type MoveCursorAction = { type: 'MoveCursor'; dir: 'left' | 'right' }
export type NoAction = { type: 'NoAction' }

export type Action =
  | PointAction
  | PassivityAction
  | CautionAction
  | InjuryToggleAction
  | ToggleBoutTimeAction
  | BufferClearedAction
  | DeleteEventAction
  | ConfirmAction
  | MoveCursorAction
  | NoAction

/**
 * Keyboard FSM for CHAMP Protocol.
 * - No timeout for sequences
 * - Escape clears buffer
 * - Invalid keys are ignored
 * - Works in 'normal' and 'correction' modes (some keys behave differently in correction)
 */
export class KeyboardFSM {
  private buffer: string[] = []

  constructor() {}

  /**
   * Normalize keyboard event key values into a simplified token
   */
  private normalizeKey(raw: string): string {
    if (!raw) return ''
    if (raw === ' ' || raw === 'Spacebar' || raw === 'Space') return 'Space'
    if (raw === 'Escape') return 'Escape'
    if (raw === 'Enter') return 'Enter'
    if (raw === 'Delete') return 'Delete'
    if (raw === 'Backspace') return 'Backspace'
    if (raw === 'ArrowLeft') return 'ArrowLeft'
    if (raw === 'ArrowRight') return 'ArrowRight'
    // Normalize single-character keys
    if (raw.length === 1) return raw.toUpperCase()
    // Fallback: upper-case
    return raw.toUpperCase()
  }

  public getBuffer(): string[] {
    return [...this.buffer]
  }

  public resetBuffer() {
    this.buffer = []
  }

  public handleKey(rawKey: string, mode: Mode = 'normal'): { action: Action | null; buffer: string[] } {
    const key = this.normalizeKey(rawKey)

    // Global shortcuts
    if (key === 'Space') {
      this.resetBuffer()
      return { action: { type: 'ToggleBoutTime' }, buffer: this.getBuffer() }
    }

    if (key === 'Escape') {
      this.resetBuffer()
      return { action: { type: 'BufferCleared' }, buffer: this.getBuffer() }
    }

    // Correction-mode specific keys
    if (mode === 'correction') {
      if (key === 'Delete') {
        this.resetBuffer()
        return { action: { type: 'DeleteEvent' }, buffer: this.getBuffer() }
      }
      if (key === 'Enter') {
        this.resetBuffer()
        return { action: { type: 'Confirm' }, buffer: this.getBuffer() }
      }
      if (key === 'Backspace' || key === 'ArrowLeft') {
        this.resetBuffer()
        return { action: { type: 'MoveCursor', dir: 'left' }, buffer: this.getBuffer() }
      }
      if (key === 'ArrowRight') {
        this.resetBuffer()
        return { action: { type: 'MoveCursor', dir: 'right' }, buffer: this.getBuffer() }
      }
    } else {
      // In normal mode Backspace is ignored
      if (key === 'Backspace') {
        return { action: null, buffer: this.getBuffer() }
      }
    }

    // Process action sequences (actor-prefixed)
    const actor = this.buffer[0] as 'R' | 'B' | undefined

    // If key is actor
    if (key === 'R' || key === 'B') {
      // Start new sequence with actor
      this.buffer = [key]
      return { action: null, buffer: this.getBuffer() }
    }

    // if there's no actor prefix, ignore numeric/other action keys
    if (!actor) {
      // Nothing valid starts without an actor (except Space/Escape already handled)
      return { action: null, buffer: this.getBuffer() }
    }

    // Now buffer[0] exists and is actor
    // Digit points
    if ((key === '1' || key === '2' || key === '4') && this.buffer.length === 1) {
      const points = key === '1' ? 1 : key === '2' ? 2 : 4
      const action: PointAction = { type: 'Point', actor: actor, points: points as 1 | 2 | 4 }
      this.resetBuffer()
      return { action, buffer: this.getBuffer() }
    }

    // Passivity
    if (key === 'P' && this.buffer.length === 1) {
      const action: PassivityAction = { type: 'Passivity', actor }
      this.resetBuffer()
      return { action, buffer: this.getBuffer() }
    }

    // Caution: actor + '0' + (1|2)
    if (key === '0' && this.buffer.length === 1) {
      // push and wait for next key (1 or 2)
      this.buffer.push('0')
      return { action: null, buffer: this.getBuffer() }
    }

    if ((key === '1' || key === '2') && this.buffer.length === 2 && this.buffer[1] === '0') {
      const points = key === '1' ? 1 : 2
      const awardedTo: 'R' | 'B' = actor === 'R' ? 'B' : 'R'
      const action: CautionAction = { type: 'Caution', actor, awardedTo, points: points as 1 | 2 }
      this.resetBuffer()
      return { action, buffer: this.getBuffer() }
    }

    // Injury toggles
    if ((key === '+' || key === '*') && this.buffer.length === 1) {
      const action: InjuryToggleAction = { type: 'InjuryToggle', actor, blood: key === '*' }
      this.resetBuffer()
      return { action, buffer: this.getBuffer() }
    }

    // For invalid continuation keys: ignore and keep buffer as-is
    return { action: null, buffer: this.getBuffer() }
  }
}
