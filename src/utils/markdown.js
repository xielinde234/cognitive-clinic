/**
 * Markdown 迷你渲染器（用于聊天消息）
 */

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderMarkdown(md) {
  let html = escapeHtml(md)

  // 标题
  html = html.replace(/^#{1,4}\s+(.*)$/gm, '<strong>$1</strong>')

  // 引用块
  html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>')

  // 加粗
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 表格
  html = buildTables(html)

  // 列表
  const lines = html.split('\n')
  const out = []
  let inList = false

  for (const line of lines) {
    const li = line.match(/^\s*[-·*]\s+(.*)/)
    const li2 = line.match(/^\s*\d+[.、]\s+(.*)/)

    if (li || li2) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${(li || li2)[1]}</li>`)
    } else {
      if (inList) {
        out.push('</ul>')
        inList = false
      }
      if (line.trim()) {
        out.push(`<p>${line}</p>`)
      } else {
        out.push('')
      }
    }
  }

  if (inList) out.push('</ul>')

  let result = out.join('')

  // 引用块样式
  result = result.replace(
    /<blockquote>([\s\S]*?)<\/blockquote>/g,
    (m, inner) => `<div class="disclaimer">${inner}</div>`
  )

  // 去重免责声明
  result = result.replace(
    /<div class="disclaimer">[\s\S]*?<\/div>(?=[\s\S]*<div class="disclaimer">)/g,
    ''
  )

  return result
}

function buildTables(html) {
  const tables = []
  const lines = html.split('\n')
  const outLines = []
  let i = 0

  const isRow = (l) => /^\s*\|.+\|\s*$/.test(l)

  while (i < lines.length) {
    if (isRow(lines[i]) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const rows = [lines[i]]
      i += 2

      while (i < lines.length && isRow(lines[i])) {
        rows.push(lines[i])
        i++
      }

      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const head = cells(rows[0])

      let t = '<table class="md-table"><thead><tr>'
      t += head.map((h) => `<th>${h}</th>`).join('')
      t += '</tr></thead><tbody>'

      for (const r of rows.slice(1)) {
        const cs = cells(r)
        t += '<tr>' + head.map((_, k) => `<td>${cs[k] || ''}</td>`).join('') + '</tr>'
      }

      t += '</tbody></table>'
      tables.push(t)
      outLines.push('\u0000TABLE\u0000')
    } else {
      outLines.push(lines[i])
      i++
    }
  }

  // 替换表格占位符
  let result = outLines.join('\n')
  let tableIndex = 0
  result = result.replace(/\u0000TABLE\u0000/g, () => tables[tableIndex++] || '')

  return result
}
