import { MobxReactionUpdate } from "@adobe/lit-mobx"
import { css, html, LitElement, TemplateResult } from "lit-element"
import store from "../../store"
import InputHandler from "../inputhandler/InputHandler"

export default class TextArea extends MobxReactionUpdate(LitElement) {
  constructor() {
    super()
    this.tabIndex = -1
  }

  firstUpdated() {
    document.addEventListener("mouseup", (evt: MouseEvent) => this.handleMouseUp(evt))
    this.addEventListener("mousedown", this.handleMouseDown)
    this.addEventListener("mousemove", this.handleMouseMove)
    this.addEventListener("keydown", this.handleKeyDown)
  }

  updated() {
    const { x, y } = store
    this.setCaret(x, y)
  }
  
  // todo double click selection
  wrappedLines() {
    const next = [...store.lines]
    return next
  }

  render(): TemplateResult {
    this.wrappedLines()
    return html`
      ${store.lines.map((line, y) => {
        const focused = y === store.y
        const newline = html`<br />`
        return html`<span class="line" ?focused=${focused} .y=${y}
          >${!line
            ? newline
            : [...line].map((character, x) => {
                const focused = x === store.x && y === store.y
                return html`<span class="character" ?focused=${focused} .x=${x}>${character}</span>`
              })}</span
        >`
      })}
    `
  }

  handleMouseDown(evt: MouseEvent) {
    const el = <TextAreaElement>evt.composedPath()[0]
    const type = el.className
    if (["line", "character"].includes(type)) {
      const { lines } = store
      const [x, y] = type === "line" ? [lines[el.y].length, el.y] : [el.x, (<TextAreaElement>el.parentElement).y]
      store.setCoords(x, y)
    }
  }

  handleMouseMove(evt: MouseEvent) {
    if (evt.buttons === 1) {
      if (this.shadowRoot.getSelection().toString().length > 0) {
        const caret = this.shadowRoot.querySelector(".caret")
        if (caret) {
          caret.remove()
        }
      }
    }
  }

  handleMouseUp(evt: MouseEvent) {
    const selection = this.shadowRoot.getSelection()
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0)
      const end = <TextAreaElement>range.startContainer.parentElement
      const start = <TextAreaElement>range.endContainer.parentElement
      const backwards = selection.anchorNode !== selection.getRangeAt(0).startContainer

      const focusedEl = backwards ? end : start

      if (focusedEl) {
        const x = focusedEl.x + (backwards && selection.focusOffset !== 1 ? 0 : 1)
        const y = (<TextAreaElement>focusedEl.parentElement).y
        store.setCoords(x, y)
      } else {
        const target = <TextAreaElement>evt.composedPath()[0]
        if (target.className === "line") {
          const x = 0
          const y = target.y
          store.setCoords(x, y)
        } else {
          const lineHeight = Number(getComputedStyle(this).getPropertyValue("--line-height").slice(0, -2))
          var offset = this.parentElement.scrollTop
          const x = 0
          const y = Math.floor((offset + evt.pageY) / lineHeight)
          store.setCoords(x, y)
        }
      }
    }
  }

  handleKeyDown(evt: KeyboardEvent): void {
    const inputHandler = <InputHandler>this.parentNode.parentNode.lastElementChild
    if (!["Control", "Alt", "Meta", "CapsLock", "Shift"].includes(evt.key)) {
      if (!(window.api.os() === "darwin" ? evt.metaKey : evt.ctrlKey)) {
        inputHandler.focus()
      }
      inputHandler.handleKeyDown(evt)
    }
  }

  setCaret(x: number, y: number): void {
    const precursor = this.shadowRoot.querySelector(".caret")
    if (precursor) {
      precursor.remove()
    }

    const line = this.shadowRoot.children[y]
    const character = line.children[x]

    const caret = <TextAreaElement>document.createElement("span")
    caret.innerHTML = "\u00a0"
    caret.className = "caret"
    caret.x = x
    caret.y = y

    if (x === 0) {
      caret.classList.add("start")
      if (store.lines[y].length < 1) {
        caret.classList.add("blank")
        line.prepend(caret)
      } else {
        line.insertBefore(caret, line.children[1])
      }
    } else if (x === store.lines[y].length) {
      if (store.lines[y].length === 0) {
        line.prepend(caret)
      } else {
        line.appendChild(caret)
      }
    } else {
      line.insertBefore(caret, character.previousSibling)
    }
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      cursor: text;
      float: left;
      outline: none;
      white-space: nowrap;
    }

    .line {
      position: relative;
      padding-left: 0.5em;
      color: #000d;
    }

    .line[focused] {
      background-color: #0001;
      box-shadow: inset 0 0 1px #0004;
      color: #000e;
      font-weight: 450;
    }

    .character {
      padding: 10px 0;
      padding: 0.6ch;
      margin: -0.6ch;
    }

    .character:last-child {
      padding-right: 0;
      margin-right: 0;
    }

    /* .character[focused] {
      color: green;
    } */

    .caret {
      position: absolute;
      width: 3px;
      height: 100%;
      animation: blink 1s step-end infinite;
      background: #0008;
      user-select: none;
      white-space: pre;
    }

    .caret.start {
      margin-left: -1ch;
    }

    .caret.start.blank {
      margin-left: 0;
    }

    .caret.end {
      margin-left: 1ch;
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
  `
}