import sharp from 'sharp'
const src = './public/images/logo.png'

for (const size of [192, 512, 96]) {
  await sharp(src).resize(size, size).toFile(`./public/images/icon-${size}.png`)
  console.log(`icon-${size}.png done`)
}

await sharp({
  create: { width: 540, height: 720, channels: 4, background: { r: 79, g: 70, b: 229, alpha: 1 } }
}).png().toFile('./public/images/screenshot-narrow.png')
console.log('screenshot-narrow.png done')

await sharp({
  create: { width: 1280, height: 720, channels: 4, background: { r: 79, g: 70, b: 229, alpha: 1 } }
}).png().toFile('./public/images/screenshot-wide.png')
console.log('screenshot-wide.png done')

console.log('All done!')