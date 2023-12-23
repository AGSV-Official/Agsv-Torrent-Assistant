// ==UserScript==
// @name         Agsv-Torrent-Assistant
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @description  Agsv审种助手
// @author       Exception
// @match        *://*agsvpt.com/details.php*
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @grant        GM_xmlhttpRequest
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/482900/Agsv-Torrent-Assistant.user.js
// @updateURL https://update.greasyfork.org/scripts/482900/Agsv-Torrent-Assistant.meta.js
// ==/UserScript==

/**
 * /**
 * 改自SpringSunday-Torrent-Assistant https://greasyfork.org/zh-CN/scripts/448012-springsunday-torrent-assistant
 */

(function() {
    'use strict';
    /**
     * 
     */
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
 
    var title = $('#top').text();
    var exclusive = 0;
    if (title.indexOf('禁转') >= 0) {
        exclusive = 1;
    }
    title = title.replace(/禁转|\((已审|冻结|待定)\)|\[(免费|50%|2X免费|30%|2X 50%)\]|\(限时\d+.*\)|\[2X\]|\[(推荐|热门|经典|已审)\]/g, '').trim();
    console.log(title);
 
    var title_lowercase = title.toLowerCase();
    var title_type, title_encode, title_audio, title_resolution, title_group, title_is_complete;
    // medium
    if (title_lowercase.indexOf(".minibd") !== -1) {
        title_type = 2;
    } else if (title_lowercase.indexOf(".remux") !== -1) {
        title_type = 4;
    } else if (title_lowercase.indexOf(".bdrip") !== -1
        || ((title_lowercase.indexOf(".bluray") !== -1 || title_lowercase.indexOf(".blu-ray") !== -1)
            && (title_lowercase.indexOf(".x264") !== -1 || title_lowercase.indexOf(".x265") !== -1))
    ) {
        title_type = 6;
    } else if (title_lowercase.indexOf(".bluray") != -1
        || title_lowercase.indexOf(".blu-ray") != -1
    ) {
        title_type = 1;
    } else if (title_lowercase.indexOf(".webrip") !== -1
        || (title_lowercase.indexOf(".web.") !== -1
            && (title_lowercase.indexOf(".x264") !== -1 || title_lowercase.indexOf(".x265") !== -1))
    ) {
        title_type = 8;
    } else if (title_lowercase.indexOf(".web-dl") !== -1
        || title_lowercase.indexOf(".webdl") !== -1
        || title_lowercase.indexOf(".web.") !== -1
    ) {
        title_type = 7;
    } else if (title_lowercase.indexOf(".tvrip") !== -1
        || ((title_lowercase.indexOf(".hdtv") !== -1 || title_lowercase.indexOf("hdtv.") !== -1)
            && (title_lowercase.indexOf(".x264") !== -1 || title_lowercase.indexOf(".x265") !== -1))
    ) {
        title_type = 9;
    } else if (title_lowercase.indexOf(".hdtv") !== -1
        || title_lowercase.indexOf("hdtv.") !== -1
    ) {
        title_type = 5;
    } else if (title_lowercase.indexOf(".dvdrip") !== -1
        || ((title_lowercase.indexOf(".dvd") !== -1 || title_lowercase.indexOf("dvd.") !== -1)
            && (title_lowercase.indexOf(".x264") !== -1 || title_lowercase.indexOf(".x265") !== -1))
    ) {
        title_type = 10;
        title_resolution = 5;
    } else if (title_lowercase.indexOf(".dvd") !== -1
        || title_lowercase.indexOf("dvd.") !== -1
    ) {
        title_type = 3;
        title_resolution = 5;
    }
 
    // codec
    if (title_lowercase.indexOf(".x265") !== -1
        || title_lowercase.indexOf(".h265") !== -1
        || title_lowercase.indexOf(".h.265") !== -1
        || title_lowercase.indexOf(".hevc") !== -1
    ) {
        title_encode = 1;
    } else if (title_lowercase.indexOf(".x264") !== -1
        || title_lowercase.indexOf(".h264") !== -1
        || title_lowercase.indexOf(".h.264") !== -1
        || title_lowercase.indexOf(".avc") !== -1
    ) {
        title_encode = 2;
    } else if (title_lowercase.indexOf(".vc-1") !== -1
        || title_lowercase.indexOf(".vc1") !== -1
    ) {
        title_encode = 3;
    } else if (title_lowercase.indexOf("mpeg2") !== -1
        || title_lowercase.indexOf("mpeg-2") !== -1
    ) {
        title_encode = 4;
    }
 
    // audiocodec
    if (title_lowercase.indexOf(".dts-hd") !== -1
        || title_lowercase.indexOf(".dtshd") !== -1
    ) {
        title_audio = 1;
    } else if (title_lowercase.indexOf(".truehd") !== -1) {
        title_audio = 2;
    } else if (title_lowercase.indexOf(".lpcm") !== -1
        || title_lowercase.indexOf(".pcm") !== -1
    ) {
        title_audio = 6;
    } else if (title_lowercase.indexOf(".dts") !== -1) {
        title_audio = 3;
    } else if (title_lowercase.indexOf(".ac3") !== -1
        || title_lowercase.indexOf(".ac-3") !== -1
        || title_lowercase.indexOf(".ddp") !== -1
        || title_lowercase.indexOf(".dd+") !== -1
        || title_lowercase.indexOf(".dd2") !== -1
        || title_lowercase.indexOf(".dd5") !== -1
        || title_lowercase.indexOf(".dd.2") !== -1
        || title_lowercase.indexOf(".dd.5") !== -1
    ) {
        title_audio = 4;
    } else if (title_lowercase.indexOf(".aac") !== -1) {
        title_audio = 5;
    } else if (title_lowercase.indexOf(".flac") !== -1) {
        title_audio = 7;
    }
 
    // standard
    if (title_lowercase.indexOf(".2160p") !== -1
        || title_lowercase.indexOf(".uhd") !== -1
        || title_lowercase.indexOf(".4k.") !== -1
    ) {
        title_resolution = 1;
    } else if (title_lowercase.indexOf(".1080p") !== -1) {
        title_resolution = 2;
    } else if (title_lowercase.indexOf(".1080i") !== -1) {
        title_resolution = 3;
    } else if (title_lowercase.indexOf(".720p") !== -1) {
        title_resolution = 4;
    }
    if (title_lowercase.indexOf('complete') !== -1) {
        title_is_complete = true;
    }
 
    // 发布组选择
    if (title_lowercase.indexOf('cmctv') >= 0) {
        title_group = 9;
    } else if (title_lowercase.indexOf('cmct') >= 0) {
        title_group = 1;
    }
 
    var subtitle, cat, type, encode, audio, resolution, area, group, anonymous, is_complete,category;
    var poster;
    var fixtd, douban, imdb, mediainfo, mediainfo_short;

    var tdlist = $('#outer').find('td');
    for (var i = 0; i < tdlist.length; i ++) {
        var td = $(tdlist[i]);
        if (td.text() == '副标题' || td.text() == '副標題') {
            subtitle = td.parent().children().last().text();
        }
 
        if (td.text() == '添加') {
            var text = td.parent().children().last().text();
            if (text.indexOf('匿名') >= 0) {
                anonymous = 1;
            }
        }
 
        if (td.text() == '基本信息') {
            var text = td.parent().children().last().text();
            console.log(text)
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
            if (text.indexOf('[合集]') >= 0) {
                is_complete = true;
            }
            console.log("cat:"+cat);
 
            // 格式
            if (text.indexOf('Blu-ray') >= 0) {
                type = 1;
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
            } else if (text.indexOf('UHD Blu-ray') >= 0) {
                type = 11;
            } else if (text.indexOf('Track') >= 0) {
                type = 12;
            } else if (text.indexOf('Other') >= 0) {
                type = 13;
            } 
            console.log("type:"+type);
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
            }else if (text.indexOf('Other')  >= 0) {
                encode = 5;
            }
            console.log("encode:"+encode);
            // 音频编码
            if (text.indexOf('DTS-HD MA') >= 0) {
                audio = 8;
            } else if (text.indexOf('DTS') >= 0) {
                audio = 3;
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
            } else if (text.indexOf('DTS:X') >= 0) {
                audio = 18;
            } else if (text.indexOf('TrueHD Atmos') >= 0) {
                audio = 17;
            } else if (text.indexOf('DDP/E-AC3') >= 0) {
                audio = 19;
            } else if (text.indexOf('Other') >= 0) {
                audio = 7;
            }
            console.log("audio:"+audio);
            
            // 分辨率
            if (text.indexOf('2160p') >= 0) {
                resolution = 1;
            } else if (text.indexOf('1080p') >= 0) {
                resolution = 2;
            } else if (text.indexOf('1080i') >= 0) {
                resolution = 3;
            } else if (text.indexOf('720p') >= 0) {
                resolution = 4;
            } else if (text.indexOf('SD') >= 0) {
                resolution = 5;
            }
            console.log("resolution:"+resolution);
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
            } else if (text.indexOf('Other') >= 0) {
                category = 22;
            }            
            console.log("category:"+category)
        }
 
        if (td.text() == '副标题' || td.text() == '副標題') {
            subtitle = td.parent().children().last().text();
        }
 
        if (td.text() == '行为') {
            fixtd = td.parent().children().last();
        }
 
        if (td.text().trim() == '海报') {
            poster = $('#kposter').children().attr('src');
        }
    }
 
    let imdbUrl = $('#kimdb a').attr("href")
    /* if (imdbText.indexOf('douban') >= 0) {
        douban = $(element).attr('title');
    } */
    console.log(imdbUrl)
    /* if (imdbText.indexOf('imdb') >= 0) {
        imdb = $(element).attr('title');
    } */
    
    /* if (td.text() = "MediaInfo"){
        //$(this).find("")
        mediainfo_short = $('.mediainfo-short .codemain').text().replace(/\s+/g, '');
        mediainfo = $('.mediainfo-raw .codemain').text().replace(/\s+/g, '');
    } */	
 
    var screenshot = '';
    var pngCount = 0;
    var imgCount = 0;
    $('#kdescr img').each(function(index, element) {
        var src = $(element).attr('src');
        if(src != undefined) {
            if (index != 0) {
                screenshot += '\n';
            }
            screenshot += src.trim();
        }
        if (src.indexOf('.png') >= 0) {
            pngCount++;
        }
        imgCount++;
    });
 
    let error = false;
    $('#outer').prepend('<div style="display: inline-block; padding: 10px 30px; color: white; background: red; font-weight: bold;" id="assistant-tooltips"></div>');
    /* if (/\s+/.test(title)) {
        $('#assistant-tooltips').append('主标题包含空格<br/>');
        error = true;
    } */
    if(/[^\x00-\xff]+/g.test(title)) {
        $('#assistant-tooltips').append('主标题包含中文或中文字符<br/>');
        error = true;
    }
    if (!subtitle) {
        $('#assistant-tooltips').append('副标题为空<br/>');
        error = true;
    }
    if (!cat) {
        $('#assistant-tooltips').append('未选择分类<br/>');
        error = true;
    }
    if (!type) {
        $('#assistant-tooltips').append('未选择格式<br/>');
        error = true;
    } else {
        if (title_type && title_type !== type) {
            $('#assistant-tooltips').append("标题检测格式为" + type_constant[title_type] + "，选择格式为" + type_constant[type] + '<br/>');
            error = true;
        }
    }
    if (!encode) {
        $('#assistant-tooltips').append('未选择主视频编码<br/>');
        error = true;
    } else {
        if (title_encode && title_encode !== encode) {
            $('#assistant-tooltips').append("标题检测视频编码为" + encode_constant[title_encode] + "，选择视频编码为" + encode_constant[encode] + '<br/>');
            error = true;
        }
    }
    if (!audio) {
        $('#assistant-tooltips').append('未选择主音频编码<br/>');
        error = true;
    } else {
        if (title_audio && title_audio !== audio) {
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
    /* if (!area) {
        $('#assistant-tooltips').append('未选择地区<br/>');
        error = true;
    } */
    /* if (!douban && !imdb) {
        $('#assistant-tooltips').append('未检测到豆瓣或IMDb链接<br/>');
        error = true;
    }
    if (!douban && imdb) {
        $('#assistant-tooltips').append('未优先使用豆瓣链接<br/>');
        error = true;
    } */
    if (!imdbUrl) {
        $('#assistant-tooltips').append('未检测到IMDb链接<br/>');
        error = true;
    } 
    /* if(mediainfo_short === mediainfo) {
        $('#assistant-tooltips').append('媒体信息未解析<br/>');
        error = true;
    } */
    if (title_is_complete && !is_complete) {
        $('#assistant-tooltips').append('未勾选合集<br/>');
        error = true;
    }
    if (title_group && !group) {
        $('#assistant-tooltips').append('未选择制作组' + group_constant[title_group] + '<br/>');
        error = true;
    }
 
    /* if (pngCount < 3) {
        $('#assistant-tooltips').append('PNG格式的图片未满3张<br/>');
        error = true;
    } */
    if (imgCount < 1) {
        $('#assistant-tooltips').append('图片未满2张,请检查海报和预览图<br/>');
        error = true;
    } 
 
    var douban_area, douban_cat;
    if (douban) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://movie.douban.com/subject/' + douban + '/',
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            onload: function(response) {
                var html = $.parseHTML(response.responseText);
 
                var isshow, isdoc, isani;
                var douban_genres = $(html).find('#info span[property="v:genre"]');
                if (douban_genres) {
                    $(douban_genres).each(function(index, element) {
                        if ($(element).text() == '真人秀') {
                            isshow = 1;
                        }
                        if ($(element).text() == '纪录片') {
                            isdoc = 1;
                        }
                        if ($(element).text() == '动画') {
                            isani = 1;
                        }
                    })
                }
 
                var type = null;
                var comm_condition = $(html).find('div span.rec a').eq(0);
                if (comm_condition) {
                    type = $(comm_condition).attr('data-type');
                }
 
                var res = $(html).find('#info').contents()
                    .filter(function() {
                        return this.nodeType == 3;
                    }).text();
 
                var result = [];
                var array = res.split('\n');
                for (var i = 0; i < array.length; i++) {
                    if (array[i] != '') {
                        var subarray = array[i].split('/');
                        var subresult = [];
                        for (var j = 0; j < subarray.length; j++) {
                            if (subarray[j].trim() != '') {
                                subresult.push(subarray[j].trim());
                            }
                        }
                        if (subresult.length > 0) {
                            result.push(subresult);
                        }
                    }
                }
 
                var country = result[0][0];
                console.log('country ' + country);
 
                // 地区判定
 
                if (country == '中国大陆') {
                    douban_area = 1;
                } else if (country == '中国香港') {
                    douban_area = 2;
                } else if (country == '中国台湾') {
                    douban_area = 3;
                } else if (country == '印度') {
                    douban_area = 7;
                }  else if (country == '日本') {
                    douban_area = 5;
                } else if (country == '韩国') {
                    douban_area = 6;
                } else if (country == '泰国') {
                    douban_area = 9;
                } else if (country == '美国' || country == '英国' || country == '法国' || country == '德国' || country == '西德' || country == '波兰' || country == '意大利' || country == '西班牙'
                           || country == '加拿大' || country == '爱尔兰' || country == '瑞典' || country == '巴西' || country == '丹麦' || country == '奥地利') {
                    douban_area = 4;
                } else if (country == '苏联' || country == '俄罗斯') {
                    douban_area = 8;
                } else {
                    douban_area = 99;
                }
 
                if (type == '电视剧') {
                    if (isshow) {
                        douban_cat = 505;
                    } else if (isdoc) {
                        douban_cat = 503;
                    } else if (isani) {
                        douban_cat = 504;
                    } else {
                        douban_cat = 502;
                    }
                } else {
                    if (isdoc) {
                        douban_cat = 503;
                    } else if (isani) {
                        douban_cat = 504;
                    } else {
                        douban_cat = 501;
                    }
                }
 
                if (cat && douban_cat && douban_cat >= 501 && douban_cat <= 505 && douban_cat !== cat) {
                    $('#assistant-tooltips').append("豆瓣检测分类为" + cat_constant[douban_cat] + "，选择分类为" + cat_constant[cat] + '<br/>');
                    error = true;
                }
 
                if (area && douban_area && douban_area !== area) {
                    $('#assistant-tooltips').append("豆瓣检测地区为" + area_constant[douban_area] + "，选择地区为" + area_constant[area] + '<br/>');
                    error = true;
                }
 
                if (error) {
                    $('#assistant-tooltips').css('background', 'red');
                } else {
                    $('#assistant-tooltips').append('此种子未检测到异常');
                    $('#assistant-tooltips').css('background', 'green');
                }
            }
        });
    } else {
        if (error) {
            $('#assistant-tooltips').css('background', 'red');
        } else {
            $('#assistant-tooltips').append('此种子未检测到异常');
            $('#assistant-tooltips').css('background', 'green');
        }
    }
})();