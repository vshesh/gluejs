import { describe, it, expect, beforeEach } from 'vitest'
import { renderAll } from '../browser'
import { Standard } from '../library'

describe('renderAll', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a single script[type=glue] into the DOM', () => {
    document.body.innerHTML = `<script type="glue">*hello*</script>`
    renderAll({ registry: Standard })
    expect(document.body.innerHTML).toContain('<strong>hello</strong>')
  })

  it('inserts rendered HTML after the script element', () => {
    document.body.innerHTML = `
      <div id="before"></div>
      <script type="glue">_world_</script>
      <div id="after"></div>
    `
    renderAll({ registry: Standard })
    const html = document.body.innerHTML
    const emPos = html.indexOf('<em>')
    expect(emPos).toBeGreaterThan(html.indexOf('id="before"'))
    expect(emPos).toBeLessThan(html.indexOf('id="after"'))
  })

  it('processes multiple script elements', () => {
    document.body.innerHTML = `
      <script type="glue">*a*</script>
      <script type="glue">_b_</script>
    `
    renderAll({ registry: Standard })
    expect(document.body.innerHTML).toContain('<strong>a</strong>')
    expect(document.body.innerHTML).toContain('<em>b</em>')
  })

  it('defaults to StandardExtended registry', () => {
    document.body.innerHTML = `<script type="glue">{++added++}</script>`
    renderAll()
    expect(document.body.innerHTML).toContain('<ins>added</ins>')
  })

  it('only processes elements matching selector', () => {
    document.body.innerHTML = `
      <script type="glue">*yes*</script>
      <script type="text/plain">*no*</script>
    `
    renderAll({ registry: Standard })
    expect(document.body.innerHTML).toContain('<strong>yes</strong>')
    expect(document.body.innerHTML).not.toContain('<strong>no</strong>')
  })
})
