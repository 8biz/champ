import { describe, it, expect } from 'vitest'
import { KeyboardFSM } from '../src/keyboard-fsm'

describe('KeyboardFSM basic sequences', () => {
  it('records R2 as a point action and clears buffer', () => {
    const fsm = new KeyboardFSM()
    let r = fsm.handleKey('r')
    expect(r.action).toBeNull()
    expect(r.buffer).toEqual(['R'])

    r = fsm.handleKey('2')
    expect(r.action).not.toBeNull()
    expect((r.action as any).type).toBe('Point')
    expect((r.action as any).actor).toBe('R')
    expect((r.action as any).points).toBe(2)
    expect(r.buffer).toEqual([])
  })

  it('handles caution R0B2 with ignored invalid key in between', () => {
    const fsm = new KeyboardFSM()
    let r = fsm.handleKey('R')
    expect(r.action).toBeNull()
    expect(r.buffer).toEqual(['R'])

    r = fsm.handleKey('0')
    expect(r.action).toBeNull()
    expect(r.buffer).toEqual(['R', '0'])

    r = fsm.handleKey('x') // invalid — ignored
    expect(r.action).toBeNull()
    expect(r.buffer).toEqual(['R', '0'])

    r = fsm.handleKey('2')
    expect(r.action).not.toBeNull()
    expect((r.action as any).type).toBe('Caution')
    expect((r.action as any).actor).toBe('R')
    expect((r.action as any).awardedTo).toBe('B')
    expect((r.action as any).points).toBe(2)
    expect(r.buffer).toEqual([])
  })

  it('handles injury toggle B*', () => {
    const fsm = new KeyboardFSM()
    let r = fsm.handleKey('b')
    expect(r.action).toBeNull()
    expect(r.buffer).toEqual(['B'])

    r = fsm.handleKey('*')
    expect(r.action).not.toBeNull()
    expect((r.action as any).type).toBe('InjuryToggle')
    expect((r.action as any).actor).toBe('B')
    expect((r.action as any).blood).toBe(true)
    expect(r.buffer).toEqual([])
  })

  it('space toggles bout time', () => {
    const fsm = new KeyboardFSM()
    const r = fsm.handleKey(' ')
    expect((r.action as any).type).toBe('ToggleBoutTime')
    expect(r.buffer).toEqual([])
  })

  it('escape clears buffer', () => {
    const fsm = new KeyboardFSM()
    let r = fsm.handleKey('r')
    expect(r.buffer).toEqual(['R'])
    r = fsm.handleKey('Escape')
    expect((r.action as any).type).toBe('BufferCleared')
    expect(r.buffer).toEqual([])
  })

  it('digit without actor is ignored', () => {
    const fsm = new KeyboardFSM()
    const r = fsm.handleKey('1')
    expect(r.action).toBeNull()
    expect(r.buffer).toEqual([])
  })

  it('backspace acts as left arrow in correction mode', () => {
    const fsm = new KeyboardFSM()
    const r = fsm.handleKey('Backspace', 'correction')
    expect((r.action as any).type).toBe('MoveCursor')
    expect((r.action as any).dir).toBe('left')
    expect(r.buffer).toEqual([])
  })

  it('delete in correction mode deletes event', () => {
    const fsm = new KeyboardFSM()
    const r = fsm.handleKey('Delete', 'correction')
    expect((r.action as any).type).toBe('DeleteEvent')
    expect(r.buffer).toEqual([])
  })

  it('enter in correction mode confirms changes', () => {
    const fsm = new KeyboardFSM()
    const r = fsm.handleKey('Enter', 'correction')
    expect((r.action as any).type).toBe('Confirm')
    expect(r.buffer).toEqual([])
  })

  it('is case-insensitive (r + p)', () => {
    const fsm = new KeyboardFSM()
    let r = fsm.handleKey('r')
    expect(r.buffer).toEqual(['R'])
    r = fsm.handleKey('p')
    expect((r.action as any).type).toBe('Passivity')
    expect((r.action as any).actor).toBe('R')
    expect(r.buffer).toEqual([])
  })
})
