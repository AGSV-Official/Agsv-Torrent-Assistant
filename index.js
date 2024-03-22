// ==UserScript==
// @name         Agsv-Torrent-Assistant
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Agsv审种助手
// @author       Exception & 7ommy
// @match        *://*.agsvpt.com/details.php*
// @match        *://*.agsvpt.com/web/torrent-approval-page?torrent_id=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=agsvpt.com
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/482900/Agsv-Torrent-Assistant.user.js
// @updateURL https://update.greasyfork.org/scripts/482900/Agsv-Torrent-Assistant.meta.js
// ==/UserScript==

/*
 * 改自SpringSunday-Torrent-Assistant
 */

(function() {
    'use strict';

    // 自定义参数
    var review_info_position = 2;  // 错误提示信息位置：1:页面最上方，2:主标题正下方，3:主标题正上方
    var fontsize = "9pt";          // 一键通过按钮的字体大小
    var timeout = 200;             // 弹出页内鼠标点击间隔，单位毫秒，设置越小点击越快，但是对网络要求更高
    var biggerbuttonsize = "40pt"; // 放大的按钮大小
    var autoback = 0;              // 一键通过后返回上一页面

    let biggerbutton = GM_getValue("biggerbutton");
    let autoclose = GM_getValue("autoclose");
    let add_link_before_img = GM_getValue("add_link_before_img");

    registerMenuCommand();
    // 注册脚本菜单
    function registerMenuCommand() {
        GM_registerMenuCommand(`${ GM_getValue("biggerbutton", false) ? '✅':'❌'} 审核按钮放大`, function(){
            biggerbutton = !biggerbutton;
            GM_setValue("biggerbutton", biggerbutton);
            location.reload();
        });

        GM_registerMenuCommand(`${ GM_getValue("autoclose", false) ? '✅':'❌'} 自动关闭页面`, function(){
            autoclose = !autoclose;
            GM_setValue("autoclose", autoclose);
            location.reload();
        });

        GM_registerMenuCommand(`${ GM_getValue("add_link_before_img", false) ? '✅':'❌'} 打开图片链接`, function(){
            add_link_before_img = !add_link_before_img;
            GM_setValue("add_link_before_img", add_link_before_img);
            location.reload();
        });
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    if (isMobile){
        biggerbuttonsize = "120pt";
        autoclose = 0;
        autoback = 1;
    }

    var cat_constant = {
        401: 'Movie(电影)',
        402: 'TV Series(剧集)',
        403: 'TV Shows(综艺)',
        404: 'Documentaries(纪录)',
        405: 'Anime(动画)',
        406: 'MV(演唱)',
        407: 'Sports(体育)',
        408: 'Audio(音频)',
        409: 'Misc(其他)',
        411: 'Music(音乐)',
        412: 'Software(软件)',
        413: 'Game(游戏)',
        415: 'E-Book(电子书/有声书)',
        416: 'Comic(漫画)',
        417: 'Education(学习资料)',
        418: 'Picture(图片)',
        419: 'Playlet(短剧)'
    };

    var type_constant = {
        1: 'Blu-ray',
        2: 'DVD',
        3: 'Remux',
        5: 'HDTV',
        7: 'Encode',
        8: 'CD',
        10: 'WEB-DL',
        11: 'UHD Blu-ray',
        12: 'Track',
        13: 'Other'
    };

    var encode_constant = {
        1: 'H.264/AVC',
        2: 'VC-1',
        4: 'MPEG-2',
        5: 'Other',
        6: 'H.265/HEVC',
        12: 'AV1'
    };

    var audio_constant = {
        1: 'FLAC',
        2: 'APE',
        3: 'DTS',
        4: 'MP3',
        6: 'AAC',
        7: 'Other',
        8: 'DTS-HD MA',
        9: 'TrueHD',
        10: 'LPCM',
        11: 'DD/AC3',
        15: 'WAV',
        16: 'M4A',
        17: 'TrueHD Atmos',
        18: 'DTS:X',
        19: 'DDP/E-AC3'
    };

    var resolution_constant = {
        1: '1080p/1080i',
        3: '720p/720i',
        4: '480p/480i',
        5: '4K/2160p/2160i',
        6: '8K/4320p/4320i',
        8: 'Other'
    };

    var area_constant = {
    }

    var group_constant = {
        23: 'GodDramas',
        6: 'AGSVPT',
        20: 'AGSVMUSIC',
        21: 'AGSVWEB',
        16: 'Pack',
        22: 'Other'

    }

    const brief = $("#kdescr").text().toLowerCase();           // 获取简介
    const containsIMDbLink = brief.includes("imdb.com");       // 检查内容是否包含 imdb.com 链接
    const containsDoubanLink = brief.includes("douban.com");   // 检查内容是否包含 douban.com 链接
    const containsTMDBLink = brief.includes("themoviedb.org"); // 检查内容是否包含 themoviedb.org 链接

    // console.log(brief);

    var dbUrl; // 是否包含影片链接
    if (containsIMDbLink || containsDoubanLink || containsTMDBLink) {
        dbUrl = true;
        // console.log("内容中包含 IMDb 或 Douban 链接");
    } else {
        dbUrl = false;
        // console.log("内容中不包含 IMDb 或 Douban 链接");
    }

    var isBriefContainsInfo = false;  //是否包含Mediainfo
    if (brief.includes("general") && brief.includes("video") && brief.includes("audio")) {
        isBriefContainsInfo = true;
        // console.log("简介中包含Mediainfo");
    }
    // 中文详细info
    if (brief.includes("概览") && brief.includes("视频") && brief.includes("音频")) {
        isBriefContainsInfo = true;
        // console.log("简介中包含Mediainfo");
    }
    if (brief.includes("disc info") || brief.includes("disc size") || brief.includes(".release.info") || brief.includes("general information")) {
        isBriefContainsInfo = true;
    }
    // 杜比官种
    if (brief.includes("nfo信息")) {
        isBriefContainsInfo = true;
    }
    // frds官种
    if (brief.includes("release date") && brief.includes("source")) {
        isBriefContainsInfo = true;
    }
    if (brief.includes("release.name") || brief.includes("release.size")) {
        isBriefContainsInfo = true;
    }
    // CMCT/HDCTV官种
    if ((brief.includes("文件名") || brief.includes("文件名称")) && (brief.includes("体　积")||brief.includes("体　　积"))) {
        isBriefContainsInfo = true;
    }
    // HDChina官种
    if (brief.includes("source type") || brief.includes("video bitrate")) {
        isBriefContainsInfo = true;
    }

    var isBriefContainsForbidReseed = false;  //是否包含禁止转载
    if (brief.includes("禁止转载")) {
        isBriefContainsForbidReseed = true;
    }

    var title = $('#top').text();  // 主标题
    var exclusive = 0;
    if (title.indexOf('禁转') >= 0) {
        exclusive = 1;
    }
    title = title.replace(/禁转|\((已审|冻结|待定)\)|\[(免费|50%|2X免费|30%|2X 50%)\]|\(限时\d+.*\)|\[2X\]|\[(推荐|热门|经典|已审)\]/g, '').trim();
    title = title.replace(/剩余时间.*/g,'').trim();
    title = title.replace("(禁止)",'').trim();
    // console.log(title);
    var title_lowercase = title.toLowerCase();

    var officialSeed = 0; //官组种子
    var godDramaSeed = 0; //驻站短剧组种子
    var officialMusicSeed = 0; //官组音乐种子
    if(title_lowercase.includes("agsv")) {
        officialSeed = 1;
        //console.log("官种");
    }
    if(title_lowercase.includes("goddramas")) {
        godDramaSeed = 1;
        //console.log("短剧种");
    }
    if(title_lowercase.includes("agsvmus")) {
        officialMusicSeed = 1;
        //console.log("音乐官种");
    }

    // console.log("title_lowercase:"+title_lowercase);
    var title_type, title_encode, title_audio, title_resolution, title_group, title_is_complete, title_is_episode, title_x265, title_x264;

    // 媒介
    if(title_lowercase.includes("web-dl") || title_lowercase.includes("webdl")){
        title_type = 10;
    } else if (title_lowercase.includes("remux")) {
        title_type = 3;
    } else if ((title_lowercase.includes("blu-ray") || title_lowercase.includes("bluray") || title_lowercase.includes("uhd blu-ray") || title_lowercase.includes("uhd bluray") || title_lowercase.includes("hdtv")) && (title_lowercase.includes("x265") || title_lowercase.includes("x264"))) {
        title_type = 7;
    } else if (title_lowercase.includes("webrip") || title_lowercase.includes("web-rip") || title_lowercase.includes("dvdrip") || title_lowercase.includes("bdrip")) {
        title_type = 7;
    } else if (title_lowercase.includes("hdtv")) {
        title_type = 5;
    }

    // 视频编码
    if(title_lowercase.includes("264") || title_lowercase.includes("avc")){
        title_encode = 1;
    } else if (title_lowercase.includes("265") || title_lowercase.includes("hevc")) {
        title_encode = 6;
    } else if (title_lowercase.includes("vc") || title_lowercase.includes("vc-1")) {
        title_encode = 2;
    } else if (title_lowercase.includes("mpeg2") || title_lowercase.includes("mpeg-2")) {
        title_encode = 4;
    } else if (title_lowercase.includes("av1") || title_lowercase.includes("av-1")) {
        title_encode = 12;
    }
    //console.log("title_encode:"+title_encode);

    // 音频 可能有多个音频，选择与标题不一致，跳过
    if (title_lowercase.includes("flac")) {
        title_audio = 1;
    } else if (title_lowercase.includes("lpcm")) {
        title_audio = 10;
    } else if (title_lowercase.includes("ddp") || title_lowercase.includes("dd+") || title_lowercase.includes("eac3")) {
        title_audio = 19;
    } else if (title_lowercase.includes("aac")) {
        title_audio = 6;
    } else if (title_lowercase.includes("ac3")) {
        title_audio = 11;
    } else if (title_lowercase.includes("truehd") && title_lowercase.includes("atmos")) {
        title_audio = 17;
    } else if (title_lowercase.includes("dts-hd ma") || title_lowercase.includes("dts-hdma") || title_lowercase.includes("dts-hd")) {
        title_audio = 8;
    } else if (title_lowercase.includes("dts:x")|| title_lowercase.includes("dts: x")) {
        title_audio = 18;
    } else if (title_lowercase.includes("dts") && !title_lowercase.includes("dts-x") ) {
        title_audio = 3;
    }

    // 分辨率
    if(title_lowercase.includes("1080p") || title_lowercase.includes("1080i")){
        title_resolution = 1;
    } else if (title_lowercase.includes("720p") || title_lowercase.includes("720i")) {
        title_resolution = 3;
    } else if (title_lowercase.includes("480p") || title_lowercase.includes("480i")) {
        title_resolution = 4;
    } else if (title_lowercase.includes("4k") || title_lowercase.includes("2160p") || title_lowercase.includes("2160i") || title_lowercase.includes("uhd")) {
        title_resolution = 5;
    } else if (title_lowercase.includes("8k") || title_lowercase.includes("4320p") || title_lowercase.includes("4320i")) {
        title_resolution = 6;
    }

    if (title_lowercase.includes("complete")) {
        title_is_complete = true;
    }

    if (title_lowercase.match(/s\d+e\d+/i) || title_lowercase.match(/ep\d+/i)) {
    // if (title_lowercase.match(/s\d+e\d+/i)) {
        title_is_episode = true;
        // console.log("===============================当前为分集");
    }

    if (title_lowercase.includes("x265")) {
        title_x265 = true;
    }
    if (title_lowercase.includes("x264")) {
        title_x264 = true;
    }


    var subtitle, cat, type, encode, audio, resolution, area, group, anonymous, is_complete,category;
    var poster;
    var fixtd, douban, imdb, mediainfo, mediainfo_short,mediainfo_err;
    var isGroupSelected = false;     //是否选择了制作组
    var isReseedProhibited = false;  //是否选择了禁转标签
    var isOfficialSeedLabel = false; //是否选择了官种标签
    var isIceSeedLabel = false;      //是否选择了官种标签
    var isMediainfoEmpty = false;    //Mediainfo栏内容是否为空
    var isEpisode = false;           //电视剧是否为分集
    var isTagAudioChinese = false;   //标签是否选择国语
    var isTagTextChinese = false;    //标签是否选择中字
    var isTagTextEnglish = false;    //标签是否选择英字
    var isTagResident = false;       //标签是否选择驻站
    var isTagBigTorrent = false;     //标签是否选择大包
    var isBiggerThan1T = false;      //种子体积是否大于1T
    var isAudioChinese = false;
    var isTextChinese = false;
    var isTextEnglish = false;
    var mi_x265 = false;
    var mi_x264 = false;
    var isSubtitleAnime = false;     //副标题是是否包含动画

    var tdlist = $('#outer').find('td');
    for (var i = 0; i < tdlist.length; i ++) {
        var td = $(tdlist[i]);
        if (td.text() == '副标题' || td.text() == '副標題') {
            subtitle = td.parent().children().last().text();
            if (subtitle.includes("动画")) {
                isSubtitleAnime = true;
            }
        }

        if (td.text() == '添加') {
            var text = td.parent().children().last().text();
            if (text.indexOf('匿名') >= 0) {
                anonymous = 1;
            }
        }

        if (td.text() == '标签') {
            var text = td.parent().children().last().text();
            // console.log('标签: '+text);
            if(text.includes("禁转")){
                isReseedProhibited = true;
                // console.log("已选择禁转标签");
            }
            if(text.includes("官方")){
                isOfficialSeedLabel = true;
                // console.log("已选择官方标签");
            }
            if(text.includes("冰种")){
                isIceSeedLabel = true;
                // console.log("已选择冰种标签");
            }
            if(text.includes("驻站")){
                isTagResident = true;
                // console.log("已选择驻站标签");
            }
            if(text.includes("分集")){
                isEpisode = true;
                // console.log("已选择官方标签");
            }
            if(text.includes("国语")){
                isTagAudioChinese = true;
                // console.log("已选择官方标签");
            }
            if(text.includes("中字")){
                isTagTextChinese = true;
                // console.log("已选择官方标签");
            }
            if(text.includes("英字")){
                isTagTextEnglish = true;
                // console.log("已选择官方标签");
            }
            if(text.includes("大包")){
                isTagBigTorrent = true;
                // console.log("已选择大包标签");
            }
            if (text.indexOf('完结') >= 0) {
                is_complete = true;
            }
        }


        if (td.text() == '基本信息') {
            var text = td.parent().children().last().text();
            if(text.includes("制作组")){
                isGroupSelected = true;
                //console.log("已选择制作组");
            }
            if(text.includes("TB")){
                isBiggerThan1T = true;
                //console.log("种子体积大于1T");
            }
            // console.log(text)
            // 类型
            if (text.indexOf('Movie') >= 0) {
                cat = 401;
            } else if (text.indexOf('TV Series') >= 0) {
                cat = 402;
            } else if (text.indexOf('TV Shows') >= 0) {
                cat = 403;
            } else if (text.indexOf('Documentaries') >= 0) {
                cat = 404;
            } else if (text.indexOf('Anime') >= 0) {
                cat = 405;
            } else if (text.indexOf('MV') >= 0) {
                cat = 406;
            } else if (text.indexOf('Sports') >= 0) {
                cat = 407;
            } else if (text.indexOf('Audio') >= 0) {
                cat = 408;
            } else if (text.indexOf('Misc') >= 0) {
                cat = 409;
            } else if (text.indexOf('Music') >= 0) {
                cat = 411;
            } else if (text.indexOf('Software') >= 0) {
                cat = 412;
            } else if (text.indexOf('Game') >= 0) {
                cat = 413;
            } else if (text.indexOf('E-Book') >= 0) {
                cat = 415;
            } else if (text.indexOf('Comic') >= 0) {
                cat = 416;
            } else if (text.indexOf('Education') >= 0) {
                cat = 417;
            } else if (text.indexOf('Picture') >= 0) {
                cat = 418;
            } else if (text.indexOf('Playlet') >= 0) {
                cat = 419;
            }
            // console.log("cat:"+cat);

            // 格式
            if (text.indexOf('UHD Blu-ray') >= 0) {
                type = 11;
            } else if (text.indexOf('DVD') >= 0) {
                type = 2;
            } else if (text.indexOf('Remux') >= 0) {
                type = 3;
            } else if (text.indexOf('HDTV') >= 0) {
                type = 5;
            } else if (text.indexOf('Encode') >= 0) {
                type = 7;
            } else if (text.indexOf('CD') >= 0) {
                type = 8;
            } else if (text.indexOf('WEB-DL') >= 0) {
                type = 10;
            } else if (text.indexOf('Blu-ray') >= 0) {
                type = 1;
            } else if (text.indexOf('Track') >= 0) {
                type = 12;
            } else if (text.indexOf('媒介: Other') >= 0) {
                type = 13;
            }
            // console.log("type:"+type);
            // 视频编码
            if (text.indexOf('H.265/HEVC')  >= 0) {
                encode = 6;
            } else if (text.indexOf('H.264/AVC')  >= 0) {
                encode = 1;
            } else if (text.indexOf('VC-1')  >= 0) {
                encode = 2;
            } else if (text.indexOf('MPEG-2')  >= 0) {
                encode = 4;
            } else if (text.indexOf('AV1')  >= 0) {
                encode = 12;
            }else if (text.indexOf('编码: Other')  >= 0) {
                encode = 5;
            }
            // console.log("encode:"+encode);
            //console.log("audio:"+audio);
            // 音频编码
            if (text.indexOf('DTS-HD MA') >= 0) {
                audio = 8;
            } else if (text.indexOf('DTS:X') >= 0) {
                audio = 18;
            } else if (text.indexOf('DTS') >= 0) {
                audio = 3;
            } else if (text.indexOf('TrueHD Atmos') >= 0) {
                audio = 17;
            } else if (text.indexOf('TrueHD') >= 0) {
                audio = 9;
            } else if (text.indexOf('LPCM') >= 0) {
                audio = 10;
            } else if (text.indexOf('DD/AC3') >= 0) {
                audio = 11;
            } else if (text.indexOf('AAC') >= 0) {
                audio = 6;
            } else if (text.indexOf('FLAC') >= 0) {
                audio = 1;
            } else if (text.indexOf('APE') >= 0) {
                audio = 2;
            } else if (text.indexOf('WAV') >= 0) {
                audio = 15;
            } else if (text.indexOf('MP3') >= 0) {
                audio = 4;
            } else if (text.indexOf('M4A') >= 0) {
                audio = 16;
            } else if (text.indexOf('DDP/E-AC3') >= 0) {
                audio = 19;
            } else if (text.indexOf('音频编码: Other') >= 0) {
                audio = 7;
            }
            // console.log("audio:"+audio);
            // 分辨率
            if (text.indexOf('2160p') >= 0) {
                resolution = 5;
            } else if (text.indexOf('1080p') >= 0) {
                resolution = 1;
            } else if (text.indexOf('4320p') >= 0) {
                resolution = 6;
            } else if (text.indexOf('720p') >= 0) {
                resolution = 3;
            } else if (text.indexOf('480') >= 0) {
                resolution = 4;
            } else if (text.indexOf('分辨率: Other') >= 0) {
                resolution = 8;
            }
            // console.log("resolution:"+resolution);
            // 地区
            if (text.indexOf('Mainland(大陆)') >= 0) {
                area = 1;
            } else if (text.indexOf('Hongkong(香港)') >= 0) {
                area = 2;
            } else if (text.indexOf('Taiwan(台湾)') >= 0) {
                area = 3;
            } else if (text.indexOf('West(欧美)') >= 0) {
                area = 4;
            } else if (text.indexOf('Japan(日本)') >= 0) {
                area = 5;
            } else if (text.indexOf('Korea(韩国)') >= 0) {
                area = 6;
            } else if (text.indexOf('India(印度)') >= 0) {
                area = 7;
            } else if (text.indexOf('Russia(俄国)') >= 0) {
                area = 8;
            } else if (text.indexOf('Thailand(泰国)') >= 0) {
                area = 9;
            } else if (text.indexOf('地区: Other(其他)') >= 0) {
                area = 99;
            }
            if (text.indexOf('GodDramas') >= 0) {
                category = 23;
            } else if (text.indexOf('AGSVPT') >= 0) {
                category = 6;
            } else if (text.indexOf('AGSVMUSIC') >= 0) {
                category = 20;
            } else if (text.indexOf('AGSVWEB') >= 0) {
                category = 21;
            } else if (text.indexOf('Pack') >= 0) {
                category = 16;
            } else if (text.indexOf('制作组: Other') >= 0) {
                category = 22;
            }
            // console.log("category:"+category)
        }

        if (td.text() == '行为') {
            fixtd = td.parent().children().last();
        }

        if (td.text().trim() == '海报') {
            poster = $('#kposter').children().attr('src');
        }
        /* if (td.text().trim() == "IMDb信息") {
            if (td.parent().last().find("a").text() == "这里"){
                var fullUrl = new URL(href, window.location.origin).toString();
                td.parent().find("a").attr("href",fullUrl);
                let href = td.parent().last().find("a").attr("href").trim();
                td.parent().last().find("a").click();
            }
        }*/
        if (td.text() == "MediaInfo"){
            //$(this).find("")
            let md = td.parent().children().last();
            if(md.text()==""){
                isMediainfoEmpty = true;
                //console.log("MediaInfo栏为空");
            }
            //console.log(md.text())
            //console.log(md.children('div').length)
            //console.log(md.children('table').length)
            if (md.children('div').length>0) {
                mediainfo_short = md.text().replace(/\s+/g, '');
                mediainfo = md.text().replace(/\s+/g, '');
            } else if  (md.children('table').length>0) {
                mediainfo_short = md.children().children().children().eq(0).text().replace(/\s+/g, '');
                mediainfo = md.children().children().children().eq(1).text().replace(/\s+/g, '');
            }
            if ((containsBBCode(mediainfo) || containsBBCode(mediainfo_short)) && mediainfo_short === mediainfo){
                mediainfo_err = "MediaInfo中含有bbcode"
            }

            // 根据 Mediainfo 判断标签选择
            // console.log("===========================mediainfo:"+mediainfo);
            const audioMatch = mediainfo.match(/Audio.*?Language:(\w+)/);
            const audioLanguage = audioMatch ? audioMatch[1] : 'Not found';
            // console.log(`The language of the audio is: ${audioLanguage}`);
            if (audioLanguage.includes("Chinese") || audioLanguage.includes("Mandarin")){
                isAudioChinese = true;
            }

            const textMatches = mediainfo.match(/Text.*?Language:(\w+)/g) || [];
            const textLanguages = textMatches.map(text => {
                const match = text.match(/Language:(\w+)/);
                return match ? match[1] : 'Not found';
            });
            var textLanguage = textLanguages.join(',')
            // console.log(`The languages of the text are: ${textLanguage}`);
            if (textLanguage.includes("Chinese")){
                isTextChinese = true;
            }
            if (textLanguage.includes("English")){
                isTextEnglish = true;
            }
            if (mediainfo.includes("x264")){
                mi_x264 = true;
            }
            if (mediainfo.includes("x265")){
                mi_x265 = true;
            }
            // alert(isAudioChinese.toString() + isTextChinese.toString() + isTextEnglish.toString());
        }
    }

    function containsBBCode(str) {
        // 创建一个正则表达式来匹配 [/b]、[/color] 等结束标签
        const regex = /\[\/(b|color|i|u|img)\]/;

        // 使用正则表达式的 test 方法来检查字符串
        return regex.test(str);
    }

    let imdbUrl = $('#kimdb a').attr("href")
    /* if (imdbText.indexOf('douban') >= 0) {
        douban = $(element).attr('title');
    } */
    // console.log(imdbUrl)
    /* if (imdbText.indexOf('imdb') >= 0) {
        imdb = $(element).attr('title');
    } */

    var screenshot = '';
    var pngCount = 0;
    var imgCount = 0;
    var isBriefContainsInfoImg = false;  //是否包含冗余的影片参数图片
    $('#kdescr img').each(function(index, element) {
        var src = $(element).attr('src');
        if(src != undefined) {
            if (index != 0) {
                screenshot += '\n';
            }
            screenshot += src.trim();
            if (src.includes("img.pterclub.com/images/2024/01/10/49401952f8353abd4246023bff8de2cc.png") || src.includes("Mediainfo.png")) {
                isBriefContainsInfoImg = true;
            }
        }
        if (src.indexOf('.png') >= 0) {
            pngCount++;
        }
        imgCount++;
    });

    let error = false;
    let warning = false;

    switch(review_info_position) {
        case 1:
            $('#outer').prepend('<div style="display: inline-block; padding: 10px 30px; color: black; background: #ffdd59; font-weight: bold; border-radius: 5px; margin: 4px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips-warning"></div><br>');
            $('#outer').prepend('<div style="display: inline-block; padding: 10px 30px; color: white; background: #F44336; font-weight: bold; border-radius: 5px; margin: 4px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips"></div><br>');
            break;
        case 2:
            $('#top').after('<div style="display: inline-block; padding: 10px 30px; color: white; background: #F44336; font-weight: bold; border-radius: 5px; margin: 0px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips"></div><br><div style="display: inline-block; padding: 10px 30px; color: black; background: #ffdd59; font-weight: bold; border-radius: 5px; margin: 4px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips-warning"></div><br>');
            break;
        case 3:
            $('#top').before('<div style="display: inline-block; padding: 10px 30px; color: white; background: #F44336; font-weight: bold; border-radius: 5px; margin: 0px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips"></div><br><div style="display: inline-block; padding: 10px 30px; color: black; background: #ffdd59; font-weight: bold; border-radius: 5px; margin: 4px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips-warning"></div><br>');
            break;
        default:
            $('#top').after('<div style="display: inline-block; padding: 10px 30px; color: white; background: #F44336; font-weight: bold; border-radius: 5px; margin: 0px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips"></div><br><div style="display: inline-block; padding: 10px 30px; color: black; background: #ffdd59; font-weight: bold; border-radius: 5px; margin: 4px"; display: block; position: fixed;bottom: 0;right: 0;box-shadow: 0 0 10px rgba(0,0,0,0.5); id="assistant-tooltips-warning"></div><br>');
    }

    $('#assistant-tooltips').append('【错误】: ');
    $('#assistant-tooltips-warning').append('【警告】: ');

    /* if (/\s+/.test(title)) {
        $('#assistant-tooltips').append('主标题包含空格<br/>');
        error = true;
    } */
    if(/[^\x00-\xff]+/g.test(title) && !title.includes('￡') && !title.includes('™') && !/[\u2161-\u2169]/g.test(title) && !title.includes('Ⅰ') && !title.includes('白自在')) {
        $('#assistant-tooltips').append('主标题包含中文或中文字符<br/>');
        error = true;
    }
    if (!subtitle) {
        $('#assistant-tooltips').append('副标题为空<br/>');
        error = true;
    }

    if (isSubtitleAnime && cat !== 405) {
        $('#assistant-tooltips').append('类型未选择Anime(动漫)<br/>');
        error = true;
    }
    if (!cat) {
        $('#assistant-tooltips').append('未选择分类<br/>');
        error = true;
    }
    if (!type) {
        $('#assistant-tooltips').append('未选择媒介<br/>');
        error = true;
    } else {
        // console.log("标题检测格式为" + type_constant[title_type] + "，选择格式为" + type_constant[type]);
        if (title_type && title_type !== type) {
            $('#assistant-tooltips').append("标题检测媒介为" + type_constant[title_type] + "，选择媒介为" + type_constant[type] + '<br/>');
            error = true;
        }
    }
    if (!encode) {
        $('#assistant-tooltips').append('未选择主视频编码<br/>');
        error = true;
    } else {
        if (title_encode && title_encode !== encode) {
            // console.log("标题检测视频编码为" + encode_constant[title_encode] + "，选择视频编码为" + encode_constant[encode]);
            $('#assistant-tooltips').append("标题检测视频编码为" + encode_constant[title_encode] + "，选择视频编码为" + encode_constant[encode] + '<br/>');
            error = true;
        }
    }
    if (!audio) {
        $('#assistant-tooltips').append('未选择主音频编码<br/>');
        error = true;
    } else {
        if (title_audio && title_audio !== audio) {
            // console.log("标题检测音频编码为" + audio_constant[title_audio] + "，选择音频编码为" + audio_constant[audio]);
            // $('#assistant-tooltips-warning').append("标题检测音频编码为" + audio_constant[title_audio] + "，选择音频编码为" + audio_constant[audio] + '<br/>');
            // warning = true;
            $('#assistant-tooltips').append("标题检测音频编码为" + audio_constant[title_audio] + "，选择音频编码为" + audio_constant[audio] + '<br/>');
            error = true;
        }
    }
    if (!resolution) {
        $('#assistant-tooltips').append('未选择分辨率<br/>');
        error = true;
    } else {
        if (title_resolution && title_resolution !== resolution) {
            $('#assistant-tooltips').append("标题检测分辨率为" + resolution_constant[title_resolution] + "，选择分辨率为" + resolution_constant[resolution] + '<br/>');
            error = true;
        }
    }

    if ((resolution === 8 ||resolution === 4 || title_resolution === 4) && !(godDramaSeed || officialSeed)){
         $('#assistant-tooltips-warning').append("请检查是否有更高清的资源<br/>");
         warning = true;
    }

    if (title_is_complete && !is_complete && (cat === 402 || cat === 403 || cat === 404)) {
        $('#assistant-tooltips-warning').append("完结剧集请添加完结标签<br/>");
         warning = true;
    }

    if (!dbUrl && cat !==419) {
        $('#assistant-tooltips').append('简介中未检测到IMDb或豆瓣链接<br/>');
        error = true;
    }

    if(mediainfo_short === mediainfo && officialSeed == true) {
        $('#assistant-tooltips').append('媒体信息未解析<br/>');
        error = true;
    }
    if(mediainfo_short === mediainfo && officialSeed == false) {
        // $('#assistant-tooltips-warning').append('媒体信息未解析<br/>');
        // warning = true;
    }

    if(mediainfo_err) {
        $('#assistant-tooltips').append(mediainfo_err).append('<br/>');
        error = true;
    }

    if (officialSeed && !isGroupSelected) {
        $('#assistant-tooltips').append('未选择制作组<br/>');
        error = true;
    }

    if (godDramaSeed && !isReseedProhibited && isBriefContainsForbidReseed) {
        $('#assistant-tooltips').append('未选择禁转标签<br/>');
        error = true;
    }

    if (godDramaSeed && cat !== 419) {
        $('#assistant-tooltips').append('未选择短剧类型<br/>');
        error = true;
    }

    if (godDramaSeed && !isTagResident) {
        $('#assistant-tooltips').append('未选择驻站标签<br/>');
        error = true;
    }

    if (isBriefContainsInfoImg) {
        $('#assistant-tooltips-warning').append('请删除多余的影片参数/媒体信息图片<br/>');
        warning = true;
    }

    if (!officialSeed && isOfficialSeedLabel) {
        $('#assistant-tooltips').append('非官种不可选择官方标签<br/>');
        error = true;
    }

    if (officialSeed && !isOfficialSeedLabel) {
        $('#assistant-tooltips').append('官种未选择官方标签<br/>');
        error = true;
    }

    if ((officialSeed || godDramaSeed) && !isIceSeedLabel) {
        $('#assistant-tooltips').append('未选择冰种标签<br/>');
        error = true;
    }

    if (!isEpisode && title_is_episode) {
        $('#assistant-tooltips').append('未选择分集标签<br/>');
        error = true;
    }

    if (isBriefContainsInfo) {
        $('#assistant-tooltips').append('简介中包含Mediainfo<br/>');
        error = true;
    }

//     if(isAudioChinese && !isTagAudioChinese) {
//         $('#assistant-tooltips').append('未选择国语标签<br/>');
//         error = true;
//     }
    if(isTextChinese && !isTagTextChinese) {
        $('#assistant-tooltips-warning').append('未选择中字标签<br/>');
        warning = true;
    }
    if(isTextEnglish && !isTagTextEnglish) {
        $('#assistant-tooltips-warning').append('未选择英字标签<br/>');
        warning = true;
    }
    if(isBiggerThan1T && !isTagBigTorrent) {
        $('#assistant-tooltips-warning').append('未选择大包标签<br/>');
        warning = true;
    }
//     if(!isBiggerThan1T && isTagBigTorrent) {
//         $('#assistant-tooltips').append('小于1T的资源无需添加大包标签<br/>');
//         error = true;
//     }

    /* if (pngCount < 3) {
        $('#assistant-tooltips').append('PNG格式的图片未满3张<br/>');
        error = true;
    } */
    if (imgCount < 2) {
        $('#assistant-tooltips').append('缺少海报或截图<br/>');
        error = true;
    }
    if (isMediainfoEmpty) {
        $('#assistant-tooltips').append('Mediainfo栏为空<br/>');
        error = true;
    }

    if(mi_x264 && !title_x264 && officialSeed && category === 6){
        $('#assistant-tooltips').append('主标题中编码应为 x264<br/>');
        error = true;
    }
    if(mi_x265 && !title_x265 && officialSeed && category === 6){
        $('#assistant-tooltips').append('主标题中编码应为 x265<br/>');
        error = true;
    }

    if (officialMusicSeed) {
        $('#assistant-tooltips').empty();
        error = false;
        if (!isGroupSelected) {
            $('#assistant-tooltips').append('未选择制作组<br/>');
            error = true;
        }
    }

    if (cat === 413 || cat === 418 || cat === 415 || cat === 412 || cat === 411 || cat === 408) {
        $('#assistant-tooltips').empty();
        error = false;
        $('#assistant-tooltips-warning').empty();
        warning = false;
    }

    if(cat === 411 && !title_lowercase.includes("khz")) {
        $('#assistant-tooltips').append('主标题缺少采样频率<br/>');
        error = true;
    }

    if(cat === 411 && !title_lowercase.includes("bit")) {
        $('#assistant-tooltips').append('主标题缺少比特率<br/>');
        error = true;
    }

    var isFoundReviewLink = false; // 是否有审核按钮（仅有权限人员可一键填入错误信息）
    // 添加一键通过按钮到页面
    function addApproveLink() {
        var tdlist = $('#outer').find('td');
        var text;
        for (var i = 0; i < tdlist.length; i ++) {
            var td = $(tdlist[i]);

            if (td.text() == '行为') {
                var elements = td.parent().children().last();
                elements.contents().each(function() {
                    // console.log(this.textContent);
                    if (isFoundReviewLink) {
                        $(this).before(' | <a href="javascript:;" id="approvelink" class="small"><b><font><svg t="1655224943277" class="icon" viewBox="0 0 1397 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="45530" width="16" height="16"><path d="M1396.363636 121.018182c0 0-223.418182 74.472727-484.072727 372.363636-242.036364 269.963636-297.890909 381.672727-390.981818 530.618182C512 1014.690909 372.363636 744.727273 0 549.236364l195.490909-186.181818c0 0 176.872727 121.018182 297.890909 344.436364 0 0 307.2-474.763636 902.981818-707.490909L1396.363636 121.018182 1396.363636 121.018182zM1396.363636 121.018182" p-id="45531" fill="#8BC34A"></path></svg><svg t="1655224943277" class="icon" viewBox="0 0 1397 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="45530" width="16" height="16"><path d="M1396.363636 121.018182c0 0-223.418182 74.472727-484.072727 372.363636-242.036364 269.963636-297.890909 381.672727-390.981818 530.618182C512 1014.690909 372.363636 744.727273 0 549.236364l195.490909-186.181818c0 0 176.872727 121.018182 297.890909 344.436364 0 0 307.2-474.763636 902.981818-707.490909L1396.363636 121.018182 1396.363636 121.018182zM1396.363636 121.018182" p-id="45531" fill="#8BC34A"></path></svg>&nbsp;一键通过</font></b></a>'); // Add new hyperlink and separator
                        $('#addcuruser').after(' | <a href="javascript:;" id="approvelink_foot" class="small"><b><font><svg t="1655224943277" class="icon" viewBox="0 0 1397 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="45530" width="16" height="16"><path d="M1396.363636 121.018182c0 0-223.418182 74.472727-484.072727 372.363636-242.036364 269.963636-297.890909 381.672727-390.981818 530.618182C512 1014.690909 372.363636 744.727273 0 549.236364l195.490909-186.181818c0 0 176.872727 121.018182 297.890909 344.436364 0 0 307.2-474.763636 902.981818-707.490909L1396.363636 121.018182 1396.363636 121.018182zM1396.363636 121.018182" p-id="45531" fill="#8BC34A"></path></svg><svg t="1655224943277" class="icon" viewBox="0 0 1397 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="45530" width="16" height="16"><path d="M1396.363636 121.018182c0 0-223.418182 74.472727-484.072727 372.363636-242.036364 269.963636-297.890909 381.672727-390.981818 530.618182C512 1014.690909 372.363636 744.727273 0 549.236364l195.490909-186.181818c0 0 176.872727 121.018182 297.890909 344.436364 0 0 307.2-474.763636 902.981818-707.490909L1396.363636 121.018182 1396.363636 121.018182zM1396.363636 121.018182" p-id="45531" fill="#8BC34A"></path></svg>&nbsp;一键通过</font></b></a>'); // Add new hyperlink and separator

                        var actionLink = document.querySelector('#approvelink');
                        var approvelink_foot = document.querySelector('#approvelink_foot');
                        actionLink.style.fontSize = fontsize;
                        approvelink_foot.style.fontSize = fontsize;
                        actionLink.addEventListener('click', function(event) {
                            if (error) {
                                // alert("当前种子仍有错误!");
                                GM_setValue('autoFillErrorInfo', false);
                                var popup = document.createElement('div');
                                popup.id = "popup";
                                popup.style.fontSize = "20pt";
                                popup.style.position = "fixed";
                                popup.style.top = "10%";
                                popup.style.left = "10%";
                                popup.style.transform = "translate(-50%, -50%)";
                                popup.style.backgroundColor = "rgb(234, 32, 39)";
                                popup.style.color = "white";
                                popup.style.padding = "15px";
                                popup.style.borderRadius = "10px";
                                popup.style.display = "none";
                                document.body.appendChild(popup);

                                // 弹出悬浮框提示信息
                                popup.innerText = "当前种子仍有错误!";
                                popup.style.display = "block";

                                // 1秒后隐藏悬浮框
                                setTimeout(function() {
                                    popup.style.display = "none";
                                }, 1000);
                            }
                            event.preventDefault(); // 阻止超链接的默认行为
                            // 设置标记以供新页面使用
                            GM_setValue('autoCheckAndConfirm', true);
                            if (autoclose) {
                                GM_setValue('autoClose', true);
                            }
                            if (autoback) {
                                GM_setValue('autoBack', true);
                            }
                            // 找到并点击指定按钮
                            var specifiedButton = document.querySelector('#approval'); // 替换为实际的按钮选择器
                            if (specifiedButton) {
                                specifiedButton.click();
                            }
                        });
                        approvelink_foot.addEventListener('click', function(event) {
                            if (error) {
                                // alert("当前种子仍有错误!");
                                GM_setValue('autoFillErrorInfo', false);
                                var popup = document.createElement('div');
                                popup.id = "popup";
                                popup.style.fontSize = "20pt";
                                popup.style.position = "fixed";
                                popup.style.top = "10%";
                                popup.style.left = "10%";
                                popup.style.transform = "translate(-50%, -50%)";
                                popup.style.backgroundColor = "rgb(234, 32, 39)";
                                popup.style.color = "white";
                                popup.style.padding = "15px";
                                popup.style.borderRadius = "10px";
                                popup.style.display = "none";
                                document.body.appendChild(popup);

                                // 弹出悬浮框提示信息
                                popup.innerText = "当前种子仍有错误!";
                                popup.style.display = "block";

                                // 1秒后隐藏悬浮框
                                setTimeout(function() {
                                    popup.style.display = "none";
                                }, 1000);
                            }
                            event.preventDefault(); // 阻止超链接的默认行为
                            // 设置标记以供新页面使用
                            GM_setValue('autoCheckAndConfirm', true);
                            if (autoclose) {
                                GM_setValue('autoClose', true);
                            }
                            if (autoback) {
                                GM_setValue('autoBack', true);
                            }
                            // 找到并点击指定按钮
                            var specifiedButton = document.querySelector('#approval'); // 替换为实际的按钮选择器
                            if (specifiedButton) {
                                specifiedButton.click();
                            }
                        });
                        return false; // Exit the loop
                    }

                    if (this.textContent.includes('审核')) { // Check for text nodes containing the separator
                        // console.log("找到审核按钮");
                        isFoundReviewLink = true;
                    }
                });
            }
        }
    }

//     $('#assistant-tooltips').click(function(){
//         if (error && isFoundReviewLink) {
//             GM_setValue('autoFillErrorInfo', true);
//             // console.log("errorinfo_before:"+$("#approval-comment").html());
//             GM_setValue('errorInfo', document.getElementById('assistant-tooltips').innerHTML);
//             // 找到并点击指定按钮
//             var specifiedButton = document.querySelector('#approval'); // 替换为实际的按钮选择器
//             if (specifiedButton) {
//                 specifiedButton.click();
//             }
//         } else {
//             console.log("当前种子无错误或非种审人员，点击无效");
//         }
//     });

    // 主页面操作
    if (/https:\/\/.*\.agsvpt\.com\/details\.php\?id=.*/.test(window.location.href)) {
        addApproveLink();
        //console.log("autoFillErrorInfo:"+GM_getValue('autoFillErrorInfo'));
        //console.log("autoCheckAndConfirm:"+GM_getValue('autoCheckAndConfirm'));
        if (biggerbutton) {
            if (!error && isFoundReviewLink){
                // console.log("此种子未检测到错误");
                document.querySelector('#approvelink').style.fontSize = biggerbuttonsize;
                document.querySelector('#approvelink_foot').style.fontSize = biggerbuttonsize;
            } else if ((error && isFoundReviewLink)){
                document.querySelector('#approval').style.fontSize = biggerbuttonsize;
            }
        }
        if (GM_getValue('autoClose', false)){
            GM_setValue('autoClose', false);
            window.close();
        }
        if (GM_getValue('autoBack', false)){
            GM_setValue('autoBack', false);
            window.history.back();
        }
    }

    // 弹出页的操作
    if (/https:\/\/.*\.agsvpt\.com\/web\/torrent-approval-page\?torrent_id=.*/.test(window.location.href)) {
        // 使用延迟来等待页面可能的异步加载
        setTimeout(function() {
            //console.log("autoFillErrorInfo:"+GM_getValue('autoFillErrorInfo'));
            //console.log("autoCheckAndConfirm:"+GM_getValue('autoCheckAndConfirm'));
            if (GM_getValue('autoCheckAndConfirm', false)) {
                var radioPassButton = document.querySelector("body > div.form-comments > form > div:nth-child(3) > div > div:nth-child(4) > div").click();
                if (radioPassButton) {
                    radioPassButton.checked = true;
                }

                var confirmButton = document.querySelector("body > div.form-comments > form > div:nth-child(5) > div > button:nth-child(1)");
                if (confirmButton) {
                    // 完成操作后，清除标记
                    GM_setValue('autoCheckAndConfirm', false);
                    GM_setValue('autoFillErrorInfo', false);
                    confirmButton.click();
                }
            }
            if (GM_getValue('autoFillErrorInfo', false)) {
                var radioDenyButton = document.querySelector("body > div.form-comments > form > div:nth-child(3) > div > div:nth-child(6)").click();
                if (radioDenyButton) {
                    radioDenyButton.checked = true;
                }
                var errorInfo = GM_getValue('errorInfo', "");
                // console.log("errorInfo: "+errorInfo);
                errorInfo = errorInfo.replace("【错误】: ", "");
                errorInfo = errorInfo.replace("MediaInfo中含有bbcode", "请将MediaInfo中多余的标签删除，例如：[b][color=royalblue]******[/color][/b]");
                errorInfo = errorInfo.replace("简介中包含Mediainfo", "请删去简介中的MediaInfo");
                errorInfo = errorInfo.replace("媒体信息未解析", "请使用通过MediaInfo或者PotPlayer获取的正确的mediainfo信息，具体方法详见教程第四步https://www.agsvpt.com/forums.php?action=viewtopic&forumid=4&topicid=8");
                errorInfo = errorInfo.replace("简介中未检测到IMDb或豆瓣链接", "请补充imdb/豆瓣链接");
                errorInfo = errorInfo.replace("副标题为空", "请补充副标题");
                // console.log("errorInfo: "+errorInfo);
                $("#approval-comment").text(errorInfo);

                // 完成操作后，清除标记
                // GM_setValue('autoFillErrorInfo', false);
                // GM_setValue('errorInfo', "");
            }
        }, timeout); // 可能需要根据实际情况调整延迟时间
    }

    // 快捷键 ctrl+e 一键通过
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F4') {
            if(!error){
                let button = document.querySelector('#approvelink');
                button.click();
            }
            else {
                let button = document.querySelector('#approval');
                button.click();
            }
        }
        if (e.key === 'F3') {
            window.close();
        }
    });

    // 种子存在错误便设置变量
    if (error && isFoundReviewLink) {
        GM_setValue('autoFillErrorInfo', true);
        GM_setValue('errorInfo', document.getElementById('assistant-tooltips').innerHTML);
    } else if (!error) {
        GM_setValue('autoFillErrorInfo', false);
        // GM_setValue('errorInfo', "");
    }

    if (add_link_before_img && isFoundReviewLink) {
        // 查找ID为kdescr的元素内的所有<img>元素
        var images = document.querySelectorAll('#kdescr img');

        // 遍历这些图片
        images.forEach(function(img) {
            // 获取每个图片的源链接（src属性）
            var src = img.getAttribute('src');

            // 创建一个新的<a>元素
            var link = document.createElement('a');
            // 设置<a>元素的href属性为图片的链接
            link.setAttribute('href', src);
            // 设置<a>标签的目标为新标签页打开
            link.setAttribute('target', '_blank');
            // 插入文字或说明到<a>标签中，如果需要
            link.textContent = '打开图片链接 ( 种审用 )';

            // 创建一个新的<br>元素用于分行
            var breakLine1 = document.createElement('br');
            // 将<br>元素插入到<a>元素后面
            img.parentNode.insertBefore(breakLine1, img);
            // 将<a>元素插入到图片元素前面
            img.parentNode.insertBefore(link, img);
            // link.style.color = '#EA2027';
            // 创建一个新的<br>元素用于分行
            var breakLine2 = document.createElement('br');
            // 将<br>元素插入到<a>元素后面
            img.parentNode.insertBefore(breakLine2, img);
        });


//         $('img').click(function(event) {
//             // 阻止默认的点击行为
//             event.preventDefault();
//             // 获取图片链接
//             var imageSrc = $(this).attr('src');
//             // 打开图片链接
//             window.open(imageSrc, '_blank');
//         });
//         // 为所有 <img> 元素添加鼠标移入事件监听器
//         $('img').mouseenter(function() {
//             // 将鼠标样式设置为手型
//             $(this).css('cursor', 'pointer');
//         });

//         // 为所有 <img> 元素添加鼠标移出事件监听器
//         $('img').mouseleave(function() {
//             // 将鼠标样式恢复默认
//             $(this).css('cursor', 'auto');
//         });
    }

    //console.log("============================error:"+error+"isFoundReviewLink:"+isFoundReviewLink);
    //console.log("============================autoFillErrorInfo:"+GM_getValue('autoFillErrorInfo')+"errorInfo:"+GM_getValue('errorInfo'));


    if (error) {
        $('#assistant-tooltips').css('background', '#EA2027');
    } else {
        $('#assistant-tooltips').empty();
        $('#assistant-tooltips').append('此种子未检测到错误');
        $('#assistant-tooltips').css('background', '#8BC34A');
    }
    if (!warning) {
        $('#assistant-tooltips-warning').hide();
    }

    if (!error && warning) {
        $('#assistant-tooltips').hide();
    }
    // $('#assistant-tooltips-warning').hide();
    // console.log("warning:"+warning);



})();
