const { create, decryptMedia } = require('@open-wa/wa-automate');
const fs = require('fs-extra');
const moment = require('moment');
const fbvid = require('fbvideos');
const malScraper = require('mal-scraper')
// const malScraper = require('mal-scraper');

const serverOption = {
    headless: true,
    qrRefreshS: 20,
    qrTimeout: 0,
    authTimeout: 0,
    autoRefresh: true,
    devtools: false,
    cacheEnabled:false,
    chromiumArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
    ]
}

const opsys = process.platform;
if (opsys == "win32" || opsys == "win64") {
    serverOption['executablePath'] = 'C:\\Program Files (x86)\\Google\Chrome\\Application\\chrome.exe';
} else if (opsys == "linux") {
    serverOption['browserRevision'] = '737027';
} else if (opsys == "darwin") {
    serverOption['executablePath'] = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

const startServer = async (from) => {
    create('Imperial', serverOption)
    .then(client => {
        console.log('[SERVER] Server Started!')

            // Force it to keep the current session
            client.onStateChanged(state => {
                console.log('[State Changed]', state)
                if (state === 'CONFLICT') client.forceRefocus()
            })

            client.onMessage((message) => {
                msgHandler(client, message)
            })
        })
}

async function msgHandler (client, message) {
    try {
        // console.log(message)
        const { type, body, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg } = message
        const { id, pushname } = sender
        const { name } = chat
        const time = moment(t * 1000).format('DD/MM HH:mm:ss')
        const commands = ['Menu', 'Sticker', '#sticker', '#stiker', 'Stiker', 'stiker', 'Waifu', 'STIKERR', 'Halo', 'About', '#salam','Hai', 'Kontak','#waifu', '#Waifu', '#neko','Assalamualaikum','#wallpaper','grup']
        const cmds = commands.map(x => x + '\\b').join('|')
        const cmd = type === 'chat' ? body.match(new RegExp(cmds, 'gi')) : type === 'image' && caption ? caption.match(new RegExp(cmds, 'gi')) : ''

        if (cmd) {
            if (!isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(cmd[0]), 'from', color(pushname))
                if (isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(cmd[0]), 'from', color(pushname), 'in', color(name))
                    const args = body.trim().split(' ')
                switch (cmd[0]) {
                    case 'Menu':
                    case '#help':
                        client.sendText(from, '*Menu* : \n1. Stiker / stiker / STIKERR: kirim gambar dengan caption atau balas gambar yang sudah dikirim. \n2. stiker spasi url gambar [contoh: stiker https://avatars2.githubusercontent.com/u/24309806 ]. \n3. About= tentang bot. \n4. #wallpaper = buat download wallpaper. \n5. #waifu = Random waifu \n6. Assalamualaikum = Salam \n7. grup= Grup Bot Stiker \n8.Kontak = Kontak Owner \n *Copyright© 2020 Powered by Dandi.*')
                    break
                    case '#sticker':
                    case '#stiker':
					case 'Stiker':
                    case 'stiker':
                    case 'Sticker':
                    case 'STIKERR':
                    if (isMedia) {
                        const mediaData = await decryptMedia(message)
                        const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                        await client.sendImageAsSticker(from, imageBase64)
                    } else if (quotedMsg && quotedMsg.type == 'image') {
                        const mediaData = await decryptMedia(quotedMsg)
                        const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                        await client.sendImageAsSticker(from, imageBase64 + '\n*SILAHKAN JOIN KE GRUP https://chat.whatsapp.com/LuGYe0lyE9yEydZQYI1Xhd UNTUK MENDAPATKAN LEBIH BANYAK STIKER*')
                    } else if (args.length == 2) {
                        var isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
                        const url = args[1]
                        if (url.match(isUrl)) {
                            await client.sendStickerfromUrl(from, url, { method: 'get' })
                            .catch(err => console.log('Caught exception: ', err))
                        } else {
                            client.sendText(from, 'Url yang kamu kirim tidak valid')
                        }
                    } else {
                        client.sendText(from, '*Kirim atau Balas Gambarnya dengan Caption stiker*')
                    }
                    break
                    case '#giftstiker' :
                    case 'grup':
                        client.sendText(from, '*SILAHKAN JOIN KE GRUP https://chat.whatsapp.com/LuGYe0lyE9yEydZQYI1Xhd UNTUK MENDAPATKAN LEBIH BANYAK STIKER*')
                    break
                    case 'Assalamualaikum':
                        client.sendText(from, 'Waalaikumsalam')
                    break
                    case 'About':
                        client.sendText(from, 'Ini adalah Bot yang dibuat menggunakan JavaScript,Lalu dijalankan menggunakan terminal di rdp.')
                    break
                    case 'Halo':
                    case 'Hai':
                        client.sendText(from, 'Hai')
                    break
                    case 'Contact':
                    case 'Kontak':
                    client.sendText(from, 'Kontak Owner \n *Whatsapp: wa.me/6289636035164* \n *Instagram: @dandisubhani_* \n *Facebook*: https://www.facebook.com/ads.adandi20s')
                    break
                    case 'dfb':
                    case '#facebook':
                                    if (args.length == 2) {
                                        const url = args[1]
                                        if (!url.match(isUrl) && !url.includes('facebook.com')) return client.sendText(from, 'Maaf, url yang kamu kirim tidak valid')
                                        facebook(url)
                                            .then(async (videoMeta) => {
                                                console.log(videoMeta)
                                                try {
                                                    const shorthd = videoMeta.hd ? await urlShortener(videoMeta.hd) : 'Tidak Tersedia'
                                                    console.log('Shortlink: ' + shorthd)
                                                    const shortsd = videoMeta.sd ? await urlShortener(videoMeta.sd) : 'Tidak Tersedia'
                                                    console.log('Shortlink: ' + shortsd)
                                                    client.sendText(from, `Title: ${videoMeta.title} \nLink Download: \nHD Quality: ${shorthd} \nSD Quality: ${shortsd} \n\nDonasi: kamu dapat membantuku beli iphone dengan menyawer melalui https://saweria.co/donate/dandisubhani \nTerimakasih.`)
                                                } catch (err) {
                                                    client.sendText(from, `Error, ` + err)
                                                }
                                            })
                                            .catch((err) => {
                                                client.sendText(from, `Error, url tidak valid atau tidak memuat video \n${err}`)
                                            })
                                    }
                                    break                                
                    case '#waifu':
                    case 'Waifu':
                        q8 = q2 = Math.floor(Math.random() * 98) + 10;
                        client.sendFileFromUrl(from, 'http://randomwaifu.altervista.org/images/00'+q8+'.png', 'Waifu.png'); // UwU)/ Working Fine
                    break
                    case '#neko':
                    q2 = Math.floor(Math.random() * 900) + 300;
                    q3 = Math.floor(Math.random() * 900) + 300;
                    client.sendFileFromUrl(from, 'http://placekitten.com/'+q3+'/'+q2, 'neko.png','Neko ')
                    break;
                    case '#wallpaper' :
                       q4 = Math.floor(Math.random() * 800) + 100;
                    client.sendFileFromUrl(from, 'https://wallpaperaccess.com/download/anime-'+q4,'ini wallpaper.png','Here is your wallpaper');
                    break

                 
                }
            } else {
                if (!isGroupMsg) console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname))
                    if (isGroupMsg) console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname), 'in', color(name))
                }
        } catch (err) {
            console.log(color('[ERROR]', 'red'), err)
        }
    }

    process.on('Something went wrong', function (err) {
        console.log('Caught exception: ', err);
    });

    function color (text, color) {
      switch (color) {
        case 'red': return '\x1b[31m' + text + '\x1b[0m'
        case 'yellow': return '\x1b[33m' + text + '\x1b[0m'
    default: return '\x1b[32m' + text + '\x1b[0m' // default is green
}
}

startServer()

