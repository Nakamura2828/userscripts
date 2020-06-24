// ==UserScript==
// @name         CursiveMode
// @namespace    https://github.com/Nakamura2828/
// @version      0.2
// @description  turn text to cursive to help concentrate while reading (like reader mode); takes into account CJK variants
// @author       John Knox
// @match http*://*/*
// @grant GM_addStyle
// @grant GM_log  //needed?
// ==/UserScript==

// Makes use of the following fonts:
// * "School Cursive": http://davidocchino.com/portfolio/typography/school.html              Cursive Latin script with contextual alternative connectors
// * "Kyoukasho ICA"/ "教科書ICA Pro": https://en.morisawa.co.jp/fonts/specimen/2487          Japanese "textbook" font
// * "Hanazono A & B" / "花園明朝" : http://fonts.jp/hanazono/                                Japanese / CJK "full-coverage" mincho font
// * "PMingLiU & Extension" : https://docs.microsoft.com/en-us/typography/font-list/mingliu  Traditional Chinese mincho font
// * "SimSun & Extension" : https://docs.microsoft.com/en-us/typography/font-list/simsun     Simplified Chiense mincho font
// * "Batang" : https://docs.microsoft.com/en-us/typography/font-list/batang                 Korean mincho font
// * "Nom Na Tong" : http://nomfoundation.org/nom-tools/Nom-Font                             Vietnamese mincho font


const covered_tags = ['p','span','a','h1', 'h2', 'h3', 'h4', 'h5', 'h6','th', 'td']
const threshold = 25;
const debug = false;
var runs = 10;

var cssTagString = covered_tags.join(", ");
var xPathTagString = "//" + covered_tags.join("|//");

if(debug){
    console.log(cssTagString);
    console.log(xPathTagString);
}

// Set style sheets
GM_addStyle(cssTagString + '{font-family: "School", Helvetica, Arial, "A-OTF 教科書ICA Pro", "A-OTF Kyoukasho ICA Pro", HanaMinA, HanaMinB, sans-serif !important;}');      //generic & assumed default Japanese
GM_addStyle('*[lang="ja"]{ color: navy; font-family: "A-OTF 教科書ICA Pro", "A-OTF Kyoukasho ICA Pro", HanaMinA, HanaMinB, School, Helvetica, Arial, sans-serif !important; }');//Japanese
GM_addStyle('*[lang="zh-Hant"]{ color: red; font-family: PMingLiU, PMingLiU-ExtB, HanaMinA, HanaMinB, School, Helvetica, Arial, sans-serif !important; }');//traditional Chinese
GM_addStyle('*[lang="zh-Hant-HK"]{ color: maroon; font-family: MingLiU_HKSCS, MingLiU_HKSCS-ExtB, PMingLiU, PMingLiU-ExtB, HanaMinA, HanaMinB, School, Helvetica, Arial, sans-serif !important; }');//traditional Chinese (Hong Kong)
GM_addStyle('*[lang="zh-Hans"]{ color: blue; font-family: SimSun, SimSun-ExtB, HanaMinA, HanaMinB, School, Helvetica, Arial, sans-serif !important; }');   //simplified Chinese
GM_addStyle('*[lang="ko"]{ color: green; font-family: BatangChe, Batang, HanaMinA, HanaMinB, School, Helvetica, Arial, sans-serif !important; }');         //Korean
GM_addStyle('*[lang="vi-Hani"], .vi-nom{ color: palevioletred; font-family: "Nom Na Tong", HanaMinA, HanaMinB, School, Helvetica, Arial, sans-serif !important; }');              //Vietnamese
GM_addStyle(':root, body, body *{background-color: rgb(253, 246, 227) !important;}');  //Solarize background
GM_addStyle('.fix_text_size{font-size: 25px !important; }');         //fix small text


// Test and fix too small or too light text (slight delay and repetition in case of dynamic loading)
var checkExist = setInterval(function() {
    var iterator = document.evaluate(xPathTagString, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null );
    //var iterator = document.evaluate('//text()', document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null );

    var collector = []

    try {
        var thisNode = iterator.iterateNext();

        while (thisNode) {
            //console.log(thisNode.textContent );
            collector.push(thisNode);
            thisNode = iterator.iterateNext();
        }
    }
    catch (e) {
        alert( 'Error: Document tree modified during iteration ' + e );
    }
    console.log("Collected "+collector.length+" elements");
    for(thisNode of collector){
        if(typeof thisNode.style !== "undefined" && thisNode.textContent != null && thisNode.textContent != ''){
            var theCSSprop = window.getComputedStyle(thisNode, null).getPropertyValue("font-size");// have to depend on computed styles after CSS

            if(theCSSprop != "undefined"){
              theCSSprop = theCSSprop.substring(0,theCSSprop.length-2); // remove "px"
              if (theCSSprop < threshold){
                if(debug){
                    thisNode.style.backgroundColor = 'yellow';
                    thisNode.style.color = 'red';
                }
                var thisColor = window.getComputedStyle(thisNode, null).getPropertyValue("color");
                if(debug){
                    console.log(thisColor);
                    console.log(lightOrDark(thisColor));
                }
                if(lightOrDark(thisColor) == 'light'){
                    thisNode.style.color = 'rgb(76, 78, 77)';
                }

                //thisNode.fontSize = threshold + "px"; // doesn't seem to work
                thisNode.classList.add('fix_text_size');
                if (debug) console.log(theCSSprop + " " + threshold);
              }
            }

            //console.log(thisNode.textContent);
            //console.log(thisNode.style.fontSize);
        }
    }
    runs = runs - 1;
    if (runs <= 0) {
        clearInterval(checkExist); //break out
        //GM_log('Applied cursive style');
        console.log('Applied cursive style');
    }
}, 250); // check every 100ms



// from https://awik.io/determine-color-bright-dark-using-javascript/
function lightOrDark(color) {
    // Variables for red, green, blue values
    var r, g, b, hsp;

    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
        // If RGB --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

        r = color[1];
        g = color[2];
        b = color[3];
    }
    else {
        // If hex --> Convert it to RGB: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace(
        color.length < 5 && /./g, '$&$&'));

        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    if (hsp>127.5) {
        return 'light';
    }
    else {
        return 'dark';
    }
}
