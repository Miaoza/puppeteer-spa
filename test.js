// create.js
const fs = require('fs')
const puppeteer = require('puppeteer')
const { PDFDocument } = require('pdf-lib')

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

;(async () => {
  const browser = await puppeteer.launch({
    // 是否为无头浏览器模式，默认为无头浏览器模式
    // headless: false,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    // args: [
    //   '--no-sandbox',
    //   '--disable-dev-shm-usage',
    //   '--disable-gpu',
    //   '--no-zygote',
    //   '--disable-blink-features=LayoutNGPrinting'
    // ]
  })
  const page = await browser.newPage()
  const url = 'http://localhost:8080/previewPd'
  await page.goto(url, { waitUntil: 'networkidle0' }) // networkidle2

  await delay(500)

  const elLen = await page.$$eval('.pdf-wrap', (nodes) => {
    nodes.forEach((node) => {
      node.style = 'margin-top: 0;height: 297mm;'
    })
    return nodes?.length || 0
  })

  await delay(500)

  const len = elLen // + 1

  await page.setViewport({
    width: 800,
    height: 1132 // len ? 1132 * len : 1132
  })
  let buffers = []
  let i = 0
  while (i < len) {
    await page.evaluate(
      ({ index, len }) => {
        const node = document.querySelector('#app')
        // 页面的高度 包含滚动高度
        const scrollHeight = len * 1132
        if (scrollHeight > index * 1132) {
          // 滚动条向下滚动 distance
          node.scrollTop = index * 1132
        }
      },
      { index: i, len }
    )
    const buffer = await page.pdf({
      format: 'A4',
      // path: i + 'example.pdf',
      // fullPage: true,
      printBackground: true,
      '-webkit-print-color-adjust': 'exact',
      width: 800,
      height: 1132
    })
    buffers.push(buffer)
    i++
  }
  const pdfDoc = await PDFDocument.create()
  for (let i = 0; i < buffers.length; i++) {
    const mainDoc = await PDFDocument.load(buffers[i])
    const [aMainPage] = await pdfDoc.copyPages(
      mainDoc,
      mainDoc.getPageIndices()
    )
    pdfDoc.addPage(aMainPage)
  }

  const pdfBytes = await pdfDoc.save()
  const pdf_path = 'example.pdf'
  await fs.writeFileSync(pdf_path, pdfBytes)

  await browser.close()
})()
