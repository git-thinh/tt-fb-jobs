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

async function __pageNext() {
    if (__pageNumber >= __pageMax) return;

    __pageNumber++;
    console.log('->[2] Scroll to next page = ', __pageNumber, __list.length, __links.length);
    await m_page.evaluate('window.scrollBy(0, document.body.scrollHeight)');
    //await m_page.evaluate(() => {
    //    window.scrollBy(0, 0);
    //    window.scrollBy(0, window.innerHeight);
    //});
}

const __pageMax = 1;
let m_browser, m_page;
let __links = [], __list = [], __count = 0,
    __pageType = 0, __pageNumber = 1, __pageOpening = false;
const __url = 'https://www.facebook.com/jobs/';
const __url2 = 'https://www.facebook.com/ajax/bulk-route-definitions/';
(async () => {
    m_browser = await puppeteer.launch({ "headless": true, args: ['--start-maximized'] });
    m_page = await m_browser.newPage();
    await m_page.setViewport({ width: 1366, height: 2000 });

    m_page.on('response', async response => {
        if (__pageType == 0) {
            const url_ = response.url();
            if (url_.startsWith(__url2)) {
                var v = await response.text();
                __list.push(v);
                //console.log('-->[0] ' + url_);
                __pageOpening = false;
            }
        }
    });
    m_page.on('load', async () => {
        if (__pageType == 1) {
            console.log("Loaded: " + m_page.url());
            await m_page.screenshot({ path: '1.png' });
        }
    });

    //__pageOpening = true;
    await m_page.goto(__url);
    //await m_page.screenshot({ path: '0.png' });

    console.log('DONE ...');

    //await m_browser.close();
})();

setInterval(async function () {
    if (__pageType == 1) {

        return;
    }

    let s = '';
    const len = __list.length;
    if (len == 0) return;

    if (__count >= len) {
        if (__pageOpening == false) {
            __pageOpening = true;
            console.log('->[1] Complete page ', __pageNumber);
            __pageNext();

            if (__pageNumber >= __pageMax) {
                __pageType = 1;
                console.log('->[5] Begin get data from links = ', __links.length);
                var url = 'https://www.facebook.com' + __links.pop();
                console.log(__links.length, url);

                await m_page.goto(url);
            }
        }
        return;
    }

    s = __list[__count];
    __count++;
    var urls = __getLinks(s);
    if (urls && urls.length > 0) {
        for (var i = 0; i < urls.length; i++) __links.push(urls[i]);
        console.log('->[1] Links = ', __pageNumber, __count, __list.length, __links.length, __pageOpening);
    }
}, 1000);

