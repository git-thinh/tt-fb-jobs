const __ENV = process.env.__ENV || 'DEV';
const __SETTING = require('./setting.json')[__ENV];
console.log(__SETTING);

const _ = require('lodash');
const fs = require('fs');
const puppeteer = require('puppeteer');

function __getLinks(v) {
    var s = '';
    s = v;
    if (s.indexOf('/jobs/job-opening/') != -1) {
        if (s.indexOf('for (;;);') == 0) s = s.substr(9);
        try {
            const o = JSON.parse(s);
            if (o && o.payload && o.payload.payloads) {
                const keys = Object.keys(o.payload.payloads);
                if (keys && keys.length > 0) {
                    var urls = _.filter(keys, function (x) { return x.indexOf('/jobs/job-opening/') != -1; });
                    //console.log(urls);
                    return urls;
                }
            }
        } catch (e) { }
    }
    return [];
}

let m_browser, m_page;
let __links = [], __list = [], __count = 0, __pageNumber = 1, __opening = false;
const __url = 'https://www.facebook.com/jobs/';
const __url2 = 'https://www.facebook.com/ajax/bulk-route-definitions/';
(async () => {
    m_browser = await puppeteer.launch({ "headless": true, args: ['--start-maximized'] });
    m_page = await m_browser.newPage();
    await m_page.setViewport({ width: 1366, height: 2000 });

    m_page.on('response', async response => {
        const url_ = response.url();
        if (url_.startsWith(__url2)) {
            var v = await response.text();
            __list.push(v);
            console.log('-->[0] ' + url_);
        }
        //console.log(await response.status());
    });

    async function c(e) {
        console.log('-->[3] Page loaded ...');
        return e
    }
    m_page.on('load', () => console.log('Loaded!', m_page.url()));
    m_page.on('domcontentloaded', () => console.log('dom even fired'));

    __opening = true;
    await m_page.goto(__url);
    //await m_page.screenshot({ path: 'screenshot.png' });

    console.log('DONE ...');

    //await m_browser.close();
})();

setInterval(async function () {
    let s = '';
    const len = __list.length;
    if (len == 0) return;

    if (__count >= len) {        
        if (__pageNumber == 1) {
            __pageNumber++;
            console.log('->[2] Scroll to next page ', __pageNumber, len);
            await m_page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
        }
        return;
    }

    s = __list[__count];
    __count++;
    var urls = __getLinks(s);
    if (urls && urls.length > 0) {
        for (var i = 0; i < urls.length; i++) __links.push(urls[i]);
        console.log('-->[1] ', __count, __links.length);
    }
}, 1000);

