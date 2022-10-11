/** @license
 *
 * jsPDF - PDF Document creation from JavaScript
 * Version 0.0.2 Built on 2022-10-11T10:32:14.296Z
 *                      CommitID 00000000
 *
 * Copyright (c) 2010-2021 James Hall <james@parall.ax>, https://github.com/MrRio/jsPDF
 *               2015-2021 yWorks GmbH, http://www.yworks.com
 *               2015-2021 Lukas Holländer <lukas.hollaender@yworks.com>, https://github.com/HackbrettXXX
 *               2016-2018 Aras Abbasi <aras.abbasi@gmail.com>
 *               2010 Aaron Spike, https://github.com/acspike
 *               2012 Willow Systems Corporation, https://github.com/willowsystems
 *               2012 Pablo Hess, https://github.com/pablohess
 *               2012 Florian Jenett, https://github.com/fjenett
 *               2013 Warren Weckesser, https://github.com/warrenweckesser
 *               2013 Youssef Beddad, https://github.com/lifof
 *               2013 Lee Driscoll, https://github.com/lsdriscoll
 *               2013 Stefan Slonevskiy, https://github.com/stefslon
 *               2013 Jeremy Morel, https://github.com/jmorel
 *               2013 Christoph Hartmann, https://github.com/chris-rock
 *               2014 Juan Pablo Gaviria, https://github.com/juanpgaviria
 *               2014 James Makes, https://github.com/dollaruw
 *               2014 Diego Casorran, https://github.com/diegocr
 *               2014 Steven Spungin, https://github.com/Flamenco
 *               2014 Kenneth Glassey, https://github.com/Gavvers
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Contributor(s):
 *    siefkenj, ahwolf, rickygu, Midnith, saintclair, eaparango,
 *    kim3er, mfo, alnorth, Flamenco
 */

import _typeof from '@babel/runtime/helpers/typeof';
import { unzlibSync } from 'fflate';

var globalObject = function () {
  return "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : this;
}();

var atob, btoa;

(function () {
  atob = globalObject.atob.bind(globalObject);
  btoa = globalObject.btoa.bind(globalObject);
  return;
})();

function consoleLog() {
  if (globalObject.console && typeof globalObject.console.log === "function") {
    globalObject.console.log.apply(globalObject.console, arguments);
  }
}

function consoleWarn(str) {
  if (globalObject.console) {
    if (typeof globalObject.console.warn === "function") {
      globalObject.console.warn.apply(globalObject.console, arguments);
    } else {
      consoleLog.call(null, arguments);
    }
  }
}

function consoleError(str) {
  if (globalObject.console) {
    if (typeof globalObject.console.error === "function") {
      globalObject.console.error.apply(globalObject.console, arguments);
    } else {
      consoleLog(str);
    }
  }
}

var console = {
  log: consoleLog,
  warn: consoleWarn,
  error: consoleError
};

/**
 * jsPDF's Internal PubSub Implementation.
 * Backward compatible rewritten on 2014 by
 * Diego Casorran, https://github.com/diegocr
 *
 * @class
 * @name PubSub
 * @ignore
 */

function PubSub(context) {
  if (_typeof(context) !== "object") {
    throw new Error("Invalid Context passed to initialize PubSub (jsPDF-module)");
  }

  var topics = {};

  this.subscribe = function (topic, callback, once) {
    once = once || false;

    if (typeof topic !== "string" || typeof callback !== "function" || typeof once !== "boolean") {
      throw new Error("Invalid arguments passed to PubSub.subscribe (jsPDF-module)");
    }

    if (!topics.hasOwnProperty(topic)) {
      topics[topic] = {};
    }

    var token = Math.random().toString(35);
    topics[topic][token] = [callback, !!once];
    return token;
  };

  this.unsubscribe = function (token) {
    for (var topic in topics) {
      if (topics[topic][token]) {
        delete topics[topic][token];

        if (Object.keys(topics[topic]).length === 0) {
          delete topics[topic];
        }

        return true;
      }
    }

    return false;
  };

  this.publish = function (topic) {
    if (topics.hasOwnProperty(topic)) {
      var args = Array.prototype.slice.call(arguments, 1),
          tokens = [];

      for (var token in topics[topic]) {
        var sub = topics[topic][token];

        try {
          sub[0].apply(context, args);
        } catch (ex) {
          if (globalObject.console) {
            console.error("jsPDF PubSub Error", ex.message, ex);
          }
        }

        if (sub[1]) tokens.push(token);
      }

      if (tokens.length) tokens.forEach(this.unsubscribe);
    }
  };

  this.getTopics = function () {
    return topics;
  };
}
/**
 * Creates new jsPDF document object instance.
 * @name jsPDF
 * @class
 * @param {Object} [options] - Collection of settings initializing the jsPDF-instance
 * @param {string} [options.orientation=portrait] - Orientation of the first page. Possible values are "portrait" or "landscape" (or shortcuts "p" or "l").<br />
 * @param {string} [options.unit=mm] Measurement unit (base unit) to be used when coordinates are specified.<br />
 * Possible values are "pt" (points), "mm", "cm", "in", "px", "pc", "em" or "ex". Note that in order to get the correct scaling for "px"
 * units, you need to enable the hotfix "px_scaling" by setting options.hotfixes = ["px_scaling"].
 * @param {string/Array} [options.format=a4] The format of the first page. Can be:<ul><li>a0 - a10</li><li>b0 - b10</li><li>c0 - c10</li><li>dl</li><li>letter</li><li>government-letter</li><li>legal</li><li>junior-legal</li><li>ledger</li><li>tabloid</li><li>credit-card</li></ul><br />
 * Default is "a4". If you want to use your own format just pass instead of one of the above predefined formats the size as an number-array, e.g. [595.28, 841.89]
 * @param {boolean} [options.putOnlyUsedFonts=false] Only put fonts into the PDF, which were used.
 * @param {boolean} [options.compress=false] Compress the generated PDF.
 * @param {number} [options.precision=16] Precision of the element-positions.
 * @param {number} [options.userUnit=1.0] Not to be confused with the base unit. Please inform yourself before you use it.
 * @param {string[]} [options.hotfixes] An array of strings to enable hotfixes such as correct pixel scaling.
 * @param {Object} [options.encryption]
 * @param {string} [options.encryption.userPassword] Password for the user bound by the given permissions list.
 * @param {string} [options.encryption.ownerPassword] Both userPassword and ownerPassword should be set for proper authentication.
 * @param {string[]} [options.encryption.userPermissions] Array of permissions "print", "modify", "copy", "annot-forms", accessible by the user.
 * @param {number|"smart"} [options.floatPrecision=16]
 * @returns {jsPDF} jsPDF-instance
 * @description
 * ```
 * {
 *  orientation: 'p',
 *  unit: 'mm',
 *  format: 'a4',
 *  putOnlyUsedFonts:true,
 *  floatPrecision: 16 // or "smart", default is 16
 * }
 * ```
 *
 * @constructor
 */


function jsPDF(options) {
  var orientation = typeof arguments[0] === "string" ? arguments[0] : "p";
  var unit = arguments[1];
  var format = arguments[2];
  var compressPdf = arguments[3];
  var filters = [];
  var userUnit = 1.0;
  var precision;
  var floatPrecision = 16;
  options = options || {};

  if (_typeof(options) === "object") {
    orientation = options.orientation;
    unit = options.unit || unit;
    format = options.format || format;
    compressPdf = options.compress || options.compressPdf || compressPdf;
    userUnit = typeof options.userUnit === "number" ? Math.abs(options.userUnit) : 1.0;

    if (typeof options.precision !== "undefined") {
      precision = options.precision;
    }

    if (typeof options.floatPrecision !== "undefined") {
      floatPrecision = options.floatPrecision;
    }
  }

  filters = options.filters || (compressPdf === true ? ["FlateEncode"] : filters);
  unit = unit || "mm";
  orientation = ("" + (orientation || "P")).toLowerCase();
  var API = {
    internal: {},
    __private__: {}
  };
  API.__private__.PubSub = PubSub;
  var pdfVersion = "1.3";

  var getPdfVersion = API.__private__.getPdfVersion = function () {
    return pdfVersion;
  };

  API.__private__.setPdfVersion = function (value) {
    pdfVersion = value;
  };

  format = format || "a4";
  var ApiMode = {
    COMPAT: "compat",
    ADVANCED: "advanced"
  };
  var apiMode = ApiMode.COMPAT;
  /**
   * @return {boolean} True iff the current API mode is "advanced". See {@link advancedAPI}.
   * @memberof jsPDF#
   * @name isAdvancedAPI
   */

  API.isAdvancedAPI = function () {
    return apiMode === ApiMode.ADVANCED;
  };

  var roundToPrecision = API.roundToPrecision = API.__private__.roundToPrecision = function (number, parmPrecision) {
    var tmpPrecision = precision || parmPrecision;

    if (isNaN(number) || isNaN(tmpPrecision)) {
      throw new Error("Invalid argument passed to jsPDF.roundToPrecision");
    }

    return number.toFixed(tmpPrecision).replace(/0+$/, "");
  }; // high precision float


  var hpf = API.hpf = API.__private__.hpf = function (number) {
    if (isNaN(number)) {
      throw new Error("Invalid argument passed to jsPDF.hpf");
    }

    return roundToPrecision(number, floatPrecision);
  };

  var scale = API.scale = API.__private__.scale = function (number) {
    if (isNaN(number)) {
      throw new Error("Invalid argument passed to jsPDF.scale");
    }

    {
      return number * scaleFactor;
    }
  };

  var fileId = "00000000000000000000000000000000";

  var getFileId = API.__private__.getFileId = function () {
    return fileId;
  };

  var setFileId = API.__private__.setFileId = function (value) {
    if (typeof value !== "undefined" && /^[a-fA-F0-9]{32}$/.test(value)) {
      fileId = value.toUpperCase();
    } else {
      fileId = fileId.split("").map(function () {
        return "ABCDEF0123456789".charAt(Math.floor(Math.random() * 16));
      }).join("");
    }

    return fileId;
  };
  /**
   * @name setFileId
   * @memberof jsPDF#
   * @function
   * @instance
   * @param {string} value GUID.
   * @returns {jsPDF}
   */


  API.setFileId = function (value) {
    setFileId(value);
    return this;
  };
  /**
   * @name getFileId
   * @memberof jsPDF#
   * @function
   * @instance
   *
   * @returns {string} GUID.
   */


  API.getFileId = function () {
    return getFileId();
  };

  var creationDate;

  var convertDateToPDFDate = API.__private__.convertDateToPDFDate = function (parmDate) {
    var result = "";
    var tzoffset = parmDate.getTimezoneOffset(),
        tzsign = tzoffset < 0 ? "+" : "-",
        tzhour = Math.floor(Math.abs(tzoffset / 60)),
        tzmin = Math.abs(tzoffset % 60),
        timeZoneString = [tzsign, padd2(tzhour), "'", padd2(tzmin), "'"].join("");
    result = ["D:", parmDate.getFullYear(), padd2(parmDate.getMonth() + 1), padd2(parmDate.getDate()), padd2(parmDate.getHours()), padd2(parmDate.getMinutes()), padd2(parmDate.getSeconds()), timeZoneString].join("");
    return result;
  };

  var convertPDFDateToDate = API.__private__.convertPDFDateToDate = function (parmPDFDate) {
    var year = parseInt(parmPDFDate.substr(2, 4), 10);
    var month = parseInt(parmPDFDate.substr(6, 2), 10) - 1;
    var date = parseInt(parmPDFDate.substr(8, 2), 10);
    var hour = parseInt(parmPDFDate.substr(10, 2), 10);
    var minutes = parseInt(parmPDFDate.substr(12, 2), 10);
    var seconds = parseInt(parmPDFDate.substr(14, 2), 10); // var timeZoneHour = parseInt(parmPDFDate.substr(16, 2), 10);
    // var timeZoneMinutes = parseInt(parmPDFDate.substr(20, 2), 10);

    var resultingDate = new Date(year, month, date, hour, minutes, seconds, 0);
    return resultingDate;
  };

  var setCreationDate = API.__private__.setCreationDate = function (date) {
    var tmpCreationDateString;
    var regexPDFCreationDate = /^D:(20[0-2][0-9]|203[0-7]|19[7-9][0-9])(0[0-9]|1[0-2])([0-2][0-9]|3[0-1])(0[0-9]|1[0-9]|2[0-3])(0[0-9]|[1-5][0-9])(0[0-9]|[1-5][0-9])(\+0[0-9]|\+1[0-4]|-0[0-9]|-1[0-1])'(0[0-9]|[1-5][0-9])'?$/;

    if (typeof date === "undefined") {
      date = new Date();
    }

    if (date instanceof Date) {
      tmpCreationDateString = convertDateToPDFDate(date);
    } else if (regexPDFCreationDate.test(date)) {
      tmpCreationDateString = date;
    } else {
      throw new Error("Invalid argument passed to jsPDF.setCreationDate");
    }

    creationDate = tmpCreationDateString;
    return creationDate;
  };

  var getCreationDate = API.__private__.getCreationDate = function (type) {
    var result = creationDate;

    if (type === "jsDate") {
      result = convertPDFDateToDate(creationDate);
    }

    return result;
  };
  /**
   * @name setCreationDate
   * @memberof jsPDF#
   * @function
   * @instance
   * @param {Object} date
   * @returns {jsPDF}
   */


  API.setCreationDate = function (date) {
    setCreationDate(date);
    return this;
  };
  /**
   * @name getCreationDate
   * @memberof jsPDF#
   * @function
   * @instance
   * @param {Object} type
   * @returns {Object}
   */


  API.getCreationDate = function (type) {
    return getCreationDate(type);
  };

  var padd2 = API.__private__.padd2 = function (number) {
    return ("0" + parseInt(number)).slice(-2);
  };

  var objectNumber = 0; // 'n' Current object number

  var offsets = []; // List of offsets. Activated and reset by buildDocument(). Pupulated by various calls buildDocument makes.

  var content = [];
  var contentLength = 0;
  var additionalObjects = [];
  var pages = [];
  var currentPage;
  var outputDestination = content;

  var resetDocument = function resetDocument() {
    //reset fields relevant for objectNumber generation and xref.
    objectNumber = 0;
    contentLength = 0;
    content = [];
    offsets = [];
    additionalObjects = [];
    rootDictionaryObjId = newObjectDeferred();
    resourceDictionaryObjId = newObjectDeferred();
  };

  var setOutputDestination = function setOutputDestination(destination) {
    {
      outputDestination = destination;
    }
  };

  var out = API.__private__.out = function (string) {
    string = string.toString();
    contentLength += string.length + 1;
    outputDestination.push(string);
    return outputDestination;
  };

  var write = API.__private__.write = function (value) {
    return out(arguments.length === 1 ? value.toString() : Array.prototype.join.call(arguments, " "));
  };

  var getArrayBuffer = API.__private__.getArrayBuffer = function (data) {
    var len = data.length,
        ab = new ArrayBuffer(len),
        u8 = new Uint8Array(ab);

    while (len--) {
      u8[len] = data.charCodeAt(len);
    }

    return ab;
  };

  var pageMode; // default: 'UseOutlines';

  API.__private__.getPageMode = function () {
    return pageMode;
  };

  var layoutMode; // default: 'continuous';

  API.__private__.getLayoutMode = function () {
    return layoutMode;
  };

  var documentProperties = {
    title: "",
    subject: "",
    author: "",
    keywords: "",
    creator: ""
  };
  var fonts = {}; // collection of font objects, where key is fontKey - a dynamically created label for a given font.

  var activeFontKey; // will be string representing the KEY of the font as combination of fontName + fontStyle

  var scaleFactor; // Scale factor

  var page = 0;
  var pagesContext = [];
  var events = new PubSub(API);
  var hotfixes = options.hotfixes || [];
  var renderTargets = {};
  /**
   * Multiplies two matrices. (see {@link Matrix})
   * @param {Matrix} m1
   * @param {Matrix} m2
   * @memberof jsPDF#
   * @name matrixMult
   */

  var matrixMult = API.matrixMult = function (m1, m2) {
    return m2.multiply(m1);
  };

  var newObject = API.__private__.newObject = function () {
    var oid = newObjectDeferred();
    newObjectDeferredBegin(oid, true);
    return oid;
  }; // Does not output the object.  The caller must call newObjectDeferredBegin(oid) before outputing any data


  var newObjectDeferred = API.__private__.newObjectDeferred = function () {
    objectNumber++;

    offsets[objectNumber] = function () {
      return contentLength;
    };

    return objectNumber;
  };

  var newObjectDeferredBegin = function newObjectDeferredBegin(oid, doOutput) {
    doOutput = typeof doOutput === "boolean" ? doOutput : false;
    offsets[oid] = contentLength;

    if (doOutput) {
      out(oid + " 0 obj");
    }

    return oid;
  }; // Does not output the object until after the pages have been output.
  // Returns an object containing the objectId and content.
  // All pages have been added so the object ID can be estimated to start right after.
  // This does not modify the current objectNumber;  It must be updated after the newObjects are output.


  var newAdditionalObject = API.__private__.newAdditionalObject = function () {
    var objId = newObjectDeferred();
    var obj = {
      objId: objId,
      content: ""
    };
    additionalObjects.push(obj);
    return obj;
  };

  var rootDictionaryObjId = newObjectDeferred();
  var resourceDictionaryObjId = newObjectDeferred();

  var getFilters = API.__private__.getFilters = function () {
    return filters;
  };

  var putStream = API.__private__.putStream = function (options) {
    options = options || {};
    var data = options.data || "";
    var filters = options.filters || getFilters();
    var alreadyAppliedFilters = options.alreadyAppliedFilters || [];
    var addLength1 = options.addLength1 || false;
    var valueOfLength1 = data.length;
    var processedData = {};

    if (filters === true) {
      filters = ["FlateEncode"];
    }

    var keyValues = options.additionalKeyValues || [];

    if (typeof jsPDF.API.processDataByFilters !== "undefined") {
      processedData = jsPDF.API.processDataByFilters(data, filters);
    } else {
      processedData = {
        data: data,
        reverseChain: []
      };
    }

    var filterAsString = processedData.reverseChain + (Array.isArray(alreadyAppliedFilters) ? alreadyAppliedFilters.join(" ") : alreadyAppliedFilters.toString());

    if (processedData.data.length !== 0) {
      keyValues.push({
        key: "Length",
        value: processedData.data.length
      });

      if (addLength1 === true) {
        keyValues.push({
          key: "Length1",
          value: valueOfLength1
        });
      }
    }

    if (filterAsString.length != 0) {
      if (filterAsString.split("/").length - 1 === 1) {
        keyValues.push({
          key: "Filter",
          value: filterAsString
        });
      } else {
        keyValues.push({
          key: "Filter",
          value: "[" + filterAsString + "]"
        });

        for (var j = 0; j < keyValues.length; j += 1) {
          if (keyValues[j].key === "DecodeParms") {
            var decodeParmsArray = [];

            for (var i = 0; i < processedData.reverseChain.split("/").length - 1; i += 1) {
              decodeParmsArray.push("null");
            }

            decodeParmsArray.push(keyValues[j].value);
            keyValues[j].value = "[" + decodeParmsArray.join(" ") + "]";
          }
        }
      }
    }

    out("<<");

    for (var k = 0; k < keyValues.length; k++) {
      out("/" + keyValues[k].key + " " + keyValues[k].value);
    }

    out(">>");

    if (processedData.data.length !== 0) {
      out("stream");
      out(processedData.data);
      out("endstream");
    }
  };

  var putPage = API.__private__.putPage = function (page) {
    var pageNumber = page.number;
    var data = page.data;
    var pageObjectNumber = page.objId;
    var pageContentsObjId = page.contentsObjId;
    newObjectDeferredBegin(pageObjectNumber, true);
    out("<</Type /Page");
    out("/Parent " + page.rootDictionaryObjId + " 0 R");
    out("/Resources " + page.resourceDictionaryObjId + " 0 R");
    out("/MediaBox [" + parseFloat(hpf(page.mediaBox.bottomLeftX)) + " " + parseFloat(hpf(page.mediaBox.bottomLeftY)) + " " + hpf(page.mediaBox.topRightX) + " " + hpf(page.mediaBox.topRightY) + "]");

    if (page.cropBox !== null) {
      out("/CropBox [" + hpf(page.cropBox.bottomLeftX) + " " + hpf(page.cropBox.bottomLeftY) + " " + hpf(page.cropBox.topRightX) + " " + hpf(page.cropBox.topRightY) + "]");
    }

    if (page.bleedBox !== null) {
      out("/BleedBox [" + hpf(page.bleedBox.bottomLeftX) + " " + hpf(page.bleedBox.bottomLeftY) + " " + hpf(page.bleedBox.topRightX) + " " + hpf(page.bleedBox.topRightY) + "]");
    }

    if (page.trimBox !== null) {
      out("/TrimBox [" + hpf(page.trimBox.bottomLeftX) + " " + hpf(page.trimBox.bottomLeftY) + " " + hpf(page.trimBox.topRightX) + " " + hpf(page.trimBox.topRightY) + "]");
    }

    if (page.artBox !== null) {
      out("/ArtBox [" + hpf(page.artBox.bottomLeftX) + " " + hpf(page.artBox.bottomLeftY) + " " + hpf(page.artBox.topRightX) + " " + hpf(page.artBox.topRightY) + "]");
    }

    if (typeof page.userUnit === "number" && page.userUnit !== 1.0) {
      out("/UserUnit " + page.userUnit);
    }

    events.publish("putPage", {
      objId: pageObjectNumber,
      pageContext: pagesContext[pageNumber],
      pageNumber: pageNumber,
      page: data
    });
    out("/Contents " + pageContentsObjId + " 0 R");
    out(">>");
    out("endobj"); // Page content

    var pageContent = data.join("\n");

    newObjectDeferredBegin(pageContentsObjId, true);
    putStream({
      data: pageContent,
      filters: getFilters(),
      objectId: pageContentsObjId
    });
    out("endobj");
    return pageObjectNumber;
  };

  var putPages = API.__private__.putPages = function () {
    var n,
        i,
        pageObjectNumbers = [];

    for (n = 1; n <= page; n++) {
      pagesContext[n].objId = newObjectDeferred();
      pagesContext[n].contentsObjId = newObjectDeferred();
    }

    for (n = 1; n <= page; n++) {
      pageObjectNumbers.push(putPage({
        number: n,
        data: pages[n],
        objId: pagesContext[n].objId,
        contentsObjId: pagesContext[n].contentsObjId,
        mediaBox: pagesContext[n].mediaBox,
        cropBox: pagesContext[n].cropBox,
        bleedBox: pagesContext[n].bleedBox,
        trimBox: pagesContext[n].trimBox,
        artBox: pagesContext[n].artBox,
        userUnit: pagesContext[n].userUnit,
        rootDictionaryObjId: rootDictionaryObjId,
        resourceDictionaryObjId: resourceDictionaryObjId
      }));
    }

    newObjectDeferredBegin(rootDictionaryObjId, true);
    out("<</Type /Pages");
    var kids = "/Kids [";

    for (i = 0; i < page; i++) {
      kids += pageObjectNumbers[i] + " 0 R ";
    }

    out(kids + "]");
    out("/Count " + page);
    out(">>");
    out("endobj");
    events.publish("postPutPages");
  };

  var putXobjectDict = function putXobjectDict() {
    out("/XObject <<");

    for (var xObjectKey in renderTargets) {
      if (renderTargets.hasOwnProperty(xObjectKey) && renderTargets[xObjectKey].objectNumber >= 0) {
        out("/" + xObjectKey + " " + renderTargets[xObjectKey].objectNumber + " 0 R");
      }
    } // Loop through images, or other data objects


    events.publish("putXobjectDict");
    out(">>");
  };

  var putResourceDictionary = function putResourceDictionary(objectIds) {
    newObjectDeferredBegin(objectIds.resourcesOid, true);
    out("<<");
    out("/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]");
    putXobjectDict();
    out(">>");
    out("endobj");
  };

  var putResources = function putResources() {
    // FormObjects, Patterns etc. might use other FormObjects/Patterns/Images
    // which means their resource dictionaries must contain the already resolved
    // object ids. For this reason we defer the serialization of the resource
    // dicts until all objects have been serialized and have object ids.
    //
    // In order to prevent cyclic dependencies (which Adobe Reader doesn't like),
    // we only put all oids that are smaller than the oid of the object the
    // resource dict belongs to. This is correct behavior, since the streams
    // may only use other objects that have already been defined and thus appear
    // earlier in their respective collection.
    // Currently, this only affects tiling patterns, but a (more) correct
    // implementation of FormObjects would also define their own resource dicts.
    var deferredResourceDictionaryIds = [];
    events.publish("putResources");
    deferredResourceDictionaryIds.forEach(putResourceDictionary);
    putResourceDictionary({
      resourcesOid: resourceDictionaryObjId,
      objectOid: Number.MAX_SAFE_INTEGER // output all objects

    });
    events.publish("postPutResources");
  };

  var SAFE = function __safeCall(fn) {
    fn.foo = function __safeCallWrapper() {
      try {
        return fn.apply(this, arguments);
      } catch (e) {
        var stack = e.stack || "";
        if (~stack.indexOf(" at ")) stack = stack.split(" at ")[1];
        var m = "Error in function " + stack.split("\n")[0].split("<")[0] + ": " + e.message;

        if (globalObject.console) {
          globalObject.console.error(m, e);
          if (globalObject.alert) alert(m);
        } else {
          throw new Error(m);
        }
      }
    };

    fn.foo.bar = fn;
    return fn.foo;
  };

  var to8bitStream = function to8bitStream(text, flags) {
    /**
     * PDF 1.3 spec:
     * "For text strings encoded in Unicode, the first two bytes must be 254 followed by
     * 255, representing the Unicode byte order marker, U+FEFF. (This sequence conflicts
     * with the PDFDocEncoding character sequence thorn ydieresis, which is unlikely
     * to be a meaningful beginning of a word or phrase.) The remainder of the
     * string consists of Unicode character codes, according to the UTF-16 encoding
     * specified in the Unicode standard, version 2.0. Commonly used Unicode values
     * are represented as 2 bytes per character, with the high-order byte appearing first
     * in the string."
     *
     * In other words, if there are chars in a string with char code above 255, we
     * recode the string to UCS2 BE - string doubles in length and BOM is prepended.
     *
     * HOWEVER!
     * Actual *content* (body) text (as opposed to strings used in document properties etc)
     * does NOT expect BOM. There, it is treated as a literal GID (Glyph ID)
     *
     * Because of Adobe's focus on "you subset your fonts!" you are not supposed to have
     * a font that maps directly Unicode (UCS2 / UTF16BE) code to font GID, but you could
     * fudge it with "Identity-H" encoding and custom CIDtoGID map that mimics Unicode
     * code page. There, however, all characters in the stream are treated as GIDs,
     * including BOM, which is the reason we need to skip BOM in content text (i.e. that
     * that is tied to a font).
     *
     * To signal this "special" PDFEscape / to8bitStream handling mode,
     * API.text() function sets (unless you overwrite it with manual values
     * given to API.text(.., flags) )
     * flags.autoencode = true
     * flags.noBOM = true
     *
     * ===================================================================================
     * `flags` properties relied upon:
     *   .sourceEncoding = string with encoding label.
     *                     "Unicode" by default. = encoding of the incoming text.
     *                     pass some non-existing encoding name
     *                     (ex: 'Do not touch my strings! I know what I am doing.')
     *                     to make encoding code skip the encoding step.
     *   .outputEncoding = Either valid PDF encoding name
     *                     (must be supported by jsPDF font metrics, otherwise no encoding)
     *                     or a JS object, where key = sourceCharCode, value = outputCharCode
     *                     missing keys will be treated as: sourceCharCode === outputCharCode
     *   .noBOM
     *       See comment higher above for explanation for why this is important
     *   .autoencode
     *       See comment higher above for explanation for why this is important
     */
    var i, l, sourceEncoding, encodingBlock, outputEncoding, newtext, isUnicode, ch, bch;
    flags = flags || {};
    sourceEncoding = flags.sourceEncoding || "Unicode";
    outputEncoding = flags.outputEncoding; // This 'encoding' section relies on font metrics format
    // attached to font objects by, among others,
    // "Willow Systems' standard_font_metrics plugin"
    // see jspdf.plugin.standard_font_metrics.js for format
    // of the font.metadata.encoding Object.
    // It should be something like
    //   .encoding = {'codePages':['WinANSI....'], 'WinANSI...':{code:code, ...}}
    //   .widths = {0:width, code:width, ..., 'fof':divisor}
    //   .kerning = {code:{previous_char_code:shift, ..., 'fof':-divisor},...}

    if ((flags.autoencode || outputEncoding) && fonts[activeFontKey].metadata && fonts[activeFontKey].metadata[sourceEncoding] && fonts[activeFontKey].metadata[sourceEncoding].encoding) {
      encodingBlock = fonts[activeFontKey].metadata[sourceEncoding].encoding; // each font has default encoding. Some have it clearly defined.

      if (!outputEncoding && fonts[activeFontKey].encoding) {
        outputEncoding = fonts[activeFontKey].encoding;
      } // Hmmm, the above did not work? Let's try again, in different place.


      if (!outputEncoding && encodingBlock.codePages) {
        outputEncoding = encodingBlock.codePages[0]; // let's say, first one is the default
      }

      if (typeof outputEncoding === "string") {
        outputEncoding = encodingBlock[outputEncoding];
      } // we want output encoding to be a JS Object, where
      // key = sourceEncoding's character code and
      // value = outputEncoding's character code.


      if (outputEncoding) {
        isUnicode = false;
        newtext = [];

        for (i = 0, l = text.length; i < l; i++) {
          ch = outputEncoding[text.charCodeAt(i)];

          if (ch) {
            newtext.push(String.fromCharCode(ch));
          } else {
            newtext.push(text[i]);
          } // since we are looping over chars anyway, might as well
          // check for residual unicodeness


          if (newtext[i].charCodeAt(0) >> 8) {
            /* more than 255 */
            isUnicode = true;
          }
        }

        text = newtext.join("");
      }
    }

    i = text.length; // isUnicode may be set to false above. Hence the triple-equal to undefined

    while (isUnicode === undefined && i !== 0) {
      if (text.charCodeAt(i - 1) >> 8) {
        /* more than 255 */
        isUnicode = true;
      }

      i--;
    }

    if (!isUnicode) {
      return text;
    }

    newtext = flags.noBOM ? [] : [254, 255];

    for (i = 0, l = text.length; i < l; i++) {
      ch = text.charCodeAt(i);
      bch = ch >> 8; // divide by 256

      if (bch >> 8) {
        /* something left after dividing by 256 second time */
        throw new Error("Character at position " + i + " of string '" + text + "' exceeds 16bits. Cannot be encoded into UCS-2 BE");
      }

      newtext.push(bch);
      newtext.push(ch - (bch << 8));
    }

    return String.fromCharCode.apply(undefined, newtext);
  };

  var pdfEscape = API.__private__.pdfEscape = API.pdfEscape = function (text, flags) {
    /**
     * Replace '/', '(', and ')' with pdf-safe versions
     *
     * Doing to8bitStream does NOT make this PDF display unicode text. For that
     * we also need to reference a unicode font and embed it - royal pain in the rear.
     *
     * There is still a benefit to to8bitStream - PDF simply cannot handle 16bit chars,
     * which JavaScript Strings are happy to provide. So, while we still cannot display
     * 2-byte characters property, at least CONDITIONALLY converting (entire string containing)
     * 16bit chars to (USC-2-BE) 2-bytes per char + BOM streams we ensure that entire PDF
     * is still parseable.
     * This will allow immediate support for unicode in document properties strings.
     */
    return to8bitStream(text, flags).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  };

  var beginPage = API.__private__.beginPage = function (format) {
    pages[++page] = [];
    pagesContext[page] = {
      objId: 0,
      contentsObjId: 0,
      userUnit: Number(userUnit),
      artBox: null,
      bleedBox: null,
      cropBox: null,
      trimBox: null,
      mediaBox: {
        bottomLeftX: 0,
        bottomLeftY: 0,
        topRightX: Number(format[0]),
        topRightY: Number(format[1])
      }
    };

    _setPage(page);

    setOutputDestination(pages[currentPage]);
  };

  var _addPage = function _addPage(parmFormat) {
    var width, height;

    if (Array.isArray(parmFormat)) {
      width = parmFormat[0] * scaleFactor;
      height = parmFormat[1] * scaleFactor;
    }

    if (isNaN(width)) {
      width = format[0];
      height = format[1];
    }

    if (width > 14400 || height > 14400) {
      console.warn("A page in a PDF can not be wider or taller than 14400 userUnit. jsPDF limits the width/height to 14400");
      width = Math.min(14400, width);
      height = Math.min(14400, height);
    }

    format = [width, height];

    switch (orientation.substr(0, 1)) {
      case "l":
        if (height > width) {
          format = [height, width];
        }

        break;

      case "p":
        if (width > height) {
          format = [height, width];
        }

        break;
    }

    beginPage(format);
    events.publish("addPage", {
      pageNumber: page
    });
  };

  var _setPage = function _setPage(n) {
    if (n > 0 && n <= page) {
      currentPage = n;
    }
  };

  var getNumberOfPages = API.__private__.getNumberOfPages = API.getNumberOfPages = function () {
    return pages.length - 1;
  };

  var putInfo = API.__private__.putInfo = function () {
    out("<<");
    out("/Producer (" + pdfEscape("jsPDF " + jsPDF.version) + ")");

    for (var key in documentProperties) {
      if (documentProperties.hasOwnProperty(key) && documentProperties[key]) {
        out("/" + key.substr(0, 1).toUpperCase() + key.substr(1) + " (" + pdfEscape(documentProperties[key]) + ")");
      }
    }

    out("/CreationDate (" + pdfEscape(creationDate) + ")");
    out(">>");
    out("endobj");
  };

  var putCatalog = API.__private__.putCatalog = function (options) {
    options = options || {};
    var tmpRootDictionaryObjId = options.rootDictionaryObjId || rootDictionaryObjId;
    newObject();
    out("<<");
    out("/Type /Catalog");
    out("/Pages " + tmpRootDictionaryObjId + " 0 R"); // PDF13ref Section 7.2.1

    if (!layoutMode) layoutMode = "continuous";

    switch (layoutMode) {
      case "continuous":
        out("/PageLayout /OneColumn");
        break;

      case "single":
        out("/PageLayout /SinglePage");
        break;

      case "two":
      case "twoleft":
        out("/PageLayout /TwoColumnLeft");
        break;

      case "tworight":
        out("/PageLayout /TwoColumnRight");
        break;
    }

    events.publish("putCatalog");
    out(">>");
    out("endobj");
  };

  var putTrailer = API.__private__.putTrailer = function () {
    out("trailer");
    out("<<");
    out("/Size " + (objectNumber + 1)); // Root and Info must be the last and second last objects written respectively

    out("/Root " + objectNumber + " 0 R");
    out("/Info " + (objectNumber - 1) + " 0 R");
    out("/ID [ <" + fileId + "> <" + fileId + "> ]");
    out(">>");
  };

  var putHeader = API.__private__.putHeader = function () {
    out("%PDF-" + pdfVersion);
    out("%\xBA\xDF\xAC\xE0");
  };

  var putXRef = API.__private__.putXRef = function () {
    var p = "0000000000";
    out("xref");
    out("0 " + (objectNumber + 1));
    out("0000000000 65535 f ");

    for (var i = 1; i <= objectNumber; i++) {
      var offset = offsets[i];

      if (typeof offset === "function") {
        out((p + offsets[i]()).slice(-10) + " 00000 n ");
      } else {
        if (typeof offsets[i] !== "undefined") {
          out((p + offsets[i]).slice(-10) + " 00000 n ");
        } else {
          out("0000000000 00000 n ");
        }
      }
    }
  };

  var buildDocument = API.__private__.buildDocument = function () {
    resetDocument();
    setOutputDestination(content);
    events.publish("buildDocument");
    putHeader();
    putPages();
    putResources();
    putInfo();
    putCatalog();
    var offsetOfXRef = contentLength;
    putXRef();
    putTrailer();
    out("startxref");
    out("" + offsetOfXRef);
    out("%%EOF");
    setOutputDestination(pages[currentPage]);
    return content.join("\n");
  };
  /**
   * Generates the PDF document.
   *
   * If `type` argument is undefined, output is raw body of resulting PDF returned as a string.
   *
   * @param {string} type A string identifying one of the possible output types.<br/>
   *                      Possible values are: <br/>
   *                          'arraybuffer' -> (ArrayBuffer)<br/>
   *                          'blob' -> (Blob)<br/>
   *                          'bloburi'/'bloburl' -> (string)<br/>
   *                          'datauristring'/'dataurlstring' -> (string)<br/>
   *                          'datauri'/'dataurl' -> (undefined) -> change location to generated datauristring/dataurlstring<br/>
   *                          'dataurlnewwindow' -> (window | null | undefined) throws error if global isn't a window object(node)<br/>
   *                          'pdfobjectnewwindow' -> (window | null) throws error if global isn't a window object(node)<br/>
   *                          'pdfjsnewwindow' -> (wind | null)
   * @param {Object|string} options An object providing some additional signalling to PDF generator.<br/>
   *                                Possible options are 'filename'.<br/>
   *                                A string can be passed instead of {filename:string} and defaults to 'generated.pdf'
   * @function
   * @instance
   * @returns {string|window|ArrayBuffer|Blob|jsPDF|null|undefined}
   * @memberof jsPDF#
   * @name output
   */


  var output = API.output = API.__private__.output = SAFE(function output(type, options) {
    options = options || {};

    if (typeof options === "string") {
      options = {
        filename: options
      };
    } else {
      options.filename = options.filename || "generated.pdf";
    }

    switch (type) {
      case "arraybuffer":
        return getArrayBuffer(buildDocument());

      case "datauristring":
      case "dataurlstring":
        var dataURI = "";
        var pdfDocument = buildDocument();

        try {
          dataURI = btoa(pdfDocument);
        } catch (e) {
          dataURI = btoa(unescape(encodeURIComponent(pdfDocument)));
        }

        return "data:application/pdf;filename=" + options.filename + ";base64," + dataURI;

      default:
        return null;
    }
  });
  /**
   * Used to see if a supplied hotfix was requested when the pdf instance was created.
   * @param {string} hotfixName - The name of the hotfix to check.
   * @returns {boolean}
   */

  var hasHotfix = function hasHotfix(hotfixName) {
    return Array.isArray(hotfixes) === true && hotfixes.indexOf(hotfixName) > -1;
  };

  switch (unit) {
    case "pt":
      scaleFactor = 1;
      break;

    case "mm":
      scaleFactor = 72 / 25.4;
      break;

    case "cm":
      scaleFactor = 72 / 2.54;
      break;

    case "in":
      scaleFactor = 72;
      break;

    case "px":
      if (hasHotfix("px_scaling") == true) {
        scaleFactor = 72 / 96;
      } else {
        scaleFactor = 96 / 72;
      }

      break;

    case "pc":
      scaleFactor = 12;
      break;

    case "em":
      scaleFactor = 12;
      break;

    case "ex":
      scaleFactor = 6;
      break;

    default:
      if (typeof unit === "number") {
        scaleFactor = unit;
      } else {
        throw new Error("Invalid unit: " + unit);
      }

  }

  setCreationDate();
  setFileId();
  /**
   * Adds (and transfers the focus to) new page to the PDF document.
   * @param format {String/Array} The format of the new page. Can be: <ul><li>a0 - a10</li><li>b0 - b10</li><li>c0 - c10</li><li>dl</li><li>letter</li><li>government-letter</li><li>legal</li><li>junior-legal</li><li>ledger</li><li>tabloid</li><li>credit-card</li></ul><br />
   * Default is "a4". If you want to use your own format just pass instead of one of the above predefined formats the size as an number-array, e.g. [595.28, 841.89]
   * @param orientation {string} Orientation of the new page. Possible values are "portrait" or "landscape" (or shortcuts "p" (Default), "l").
   * @function
   * @instance
   * @returns {jsPDF}
   *
   * @memberof jsPDF#
   * @name addPage
   */

  API.addPage = function () {
    _addPage.apply(this, arguments);

    return this;
  };

  var isValidStyle = API.__private__.isValidStyle = function (style) {
    var validStyleVariants = [undefined, null, "S", "D", "F", "DF", "FD", "f", "f*", "B", "B*", "n"];
    var result = false;

    if (validStyleVariants.indexOf(style) !== -1) {
      result = true;
    }

    return result;
  };
  /**
   * Close the current path. The PDF "h" operator.
   * @name close
   * @function
   * @instance
   * @returns {jsPDF}
   * @memberof jsPDF#
   */


  var close = API.close = function () {
    out("h");
    return this;
  };

  var getHorizontalCoordinate = API.__private__.getHorizontalCoordinate = function (value) {
    return scale(value);
  };

  var getVerticalCoordinate = API.__private__.getVerticalCoordinate = function (value) {
    {
      var pageHeight = pagesContext[currentPage].mediaBox.topRightY - pagesContext[currentPage].mediaBox.bottomLeftY;
      return pageHeight - scale(value);
    }
  };

  var getHorizontalCoordinateString = API.__private__.getHorizontalCoordinateString = API.getHorizontalCoordinateString = function (value) {
    return hpf(getHorizontalCoordinate(value));
  };

  var getVerticalCoordinateString = API.__private__.getVerticalCoordinateString = API.getVerticalCoordinateString = function (value) {
    return hpf(getVerticalCoordinate(value));
  }; // applying plugins (more methods) ON TOP of built-in API.
  // this is intentional as we allow plugins to override
  // built-ins


  for (var plugin in jsPDF.API) {
    if (jsPDF.API.hasOwnProperty(plugin)) {
      if (plugin === "events" && jsPDF.API.events.length) {
        (function (events, newEvents) {
          // jsPDF.API.events is a JS Array of Arrays
          // where each Array is a pair of event name, handler
          // Events were added by plugins to the jsPDF instantiator.
          // These are always added to the new instance and some ran
          // during instantiation.
          var eventname, handler_and_args, i;

          for (i = newEvents.length - 1; i !== -1; i--) {
            // subscribe takes 3 args: 'topic', function, runonce_flag
            // if undefined, runonce is false.
            // users can attach callback directly,
            // or they can attach an array with [callback, runonce_flag]
            // that's what the "apply" magic is for below.
            eventname = newEvents[i][0];
            handler_and_args = newEvents[i][1];
            events.subscribe.apply(events, [eventname].concat(typeof handler_and_args === "function" ? [handler_and_args] : handler_and_args));
          }
        })(events, jsPDF.API.events);
      } else {
        API[plugin] = jsPDF.API[plugin];
      }
    }
  }
  /**
   * Object exposing internal API to plugins
   * @public
   * @ignore
   */


  API.internal = {
    pdfEscape: pdfEscape,
    write: write,
    getHorizontalCoordinate: getHorizontalCoordinate,
    getVerticalCoordinate: getVerticalCoordinate,
    getCoordinateString: getHorizontalCoordinateString,
    getVerticalCoordinateString: getVerticalCoordinateString,
    collections: {},
    newObject: newObject,
    newAdditionalObject: newAdditionalObject,
    newObjectDeferred: newObjectDeferred,
    newObjectDeferredBegin: newObjectDeferredBegin,
    getFilters: getFilters,
    putStream: putStream,
    events: events,
    scaleFactor: scaleFactor,
    output: output,
    getNumberOfPages: getNumberOfPages,
    pages: pages,
    out: out,
    getPDFVersion: getPdfVersion,
    hasHotfix: hasHotfix //Expose the hasHotfix check so plugins can also check them.

  };
  activeFontKey = "F1";

  _addPage(format);

  events.publish("initialized");
  return API;
}
/**
 * jsPDF.API is a STATIC property of jsPDF class.
 * jsPDF.API is an object you can add methods and properties to.
 * The methods / properties you add will show up in new jsPDF objects.
 *
 * One property is prepopulated. It is the 'events' Object. Plugin authors can add topics,
 * callbacks to this object. These will be reassigned to all new instances of jsPDF.
 *
 * @static
 * @public
 * @memberof jsPDF#
 * @name API
 *
 * @example
 * jsPDF.API.mymethod = function(){
 *   // 'this' will be ref to internal API object. see jsPDF source
 *   // , so you can refer to built-in methods like so:
 *   //     this.line(....)
 *   //     this.text(....)
 * }
 * var pdfdoc = new jsPDF()
 * pdfdoc.mymethod() // <- !!!!!!
 */


jsPDF.API = {
  events: []
};
/**
 * The version of jsPDF.
 * @name version
 * @type {string}
 * @memberof jsPDF#
 */

jsPDF.version = "0.0.2";

/** @license
 * jsPDF addImage plugin
 * Copyright (c) 2012 Jason Siefken, https://github.com/siefkenj/
 *               2013 Chris Dowling, https://github.com/gingerchris
 *               2013 Trinh Ho, https://github.com/ineedfat
 *               2013 Edwin Alejandro Perez, https://github.com/eaparango
 *               2013 Norah Smith, https://github.com/burnburnrocket
 *               2014 Diego Casorran, https://github.com/diegocr
 *               2014 James Robb, https://github.com/jamesbrobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function (jsPDFAPI) {

  var namespace = "addImage_";
  jsPDFAPI.__addimage__ = {}; // Heuristic selection of a good batch for large array .apply. Not limiting make the call overflow.
  // With too small batch iteration will be slow as more calls are made,
  // higher values cause larger and slower garbage collection.

  var ARRAY_APPLY_BATCH = 8192; // Image functionality ported from pdf.js

  var putImage = function putImage(image) {
    var out = this.internal.write;
    var putStream = this.internal.putStream;
    var getFilters = this.internal.getFilters;
    var filter = getFilters();

    while (filter.indexOf("FlateEncode") !== -1) {
      filter.splice(filter.indexOf("FlateEncode"), 1);
    }

    image.objectId = this.internal.newObject();
    var additionalKeyValues = [];
    additionalKeyValues.push({
      key: "Type",
      value: "/XObject"
    });
    additionalKeyValues.push({
      key: "Subtype",
      value: "/Image"
    });
    additionalKeyValues.push({
      key: "Width",
      value: image.width
    });
    additionalKeyValues.push({
      key: "Height",
      value: image.height
    });

    if (image.colorSpace === color_spaces.INDEXED) {
      additionalKeyValues.push({
        key: "ColorSpace",
        value: "[/Indexed /DeviceRGB " + ( // if an indexed png defines more than one colour with transparency, we've created a sMask
        image.palette.length / 3 - 1) + " " + ("sMask" in image && typeof image.sMask !== "undefined" ? image.objectId + 2 : image.objectId + 1) + " 0 R]"
      });
    } else {
      additionalKeyValues.push({
        key: "ColorSpace",
        value: "/" + image.colorSpace
      });

      if (image.colorSpace === color_spaces.DEVICE_CMYK) {
        additionalKeyValues.push({
          key: "Decode",
          value: "[1 0 1 0 1 0 1 0]"
        });
      }
    }

    additionalKeyValues.push({
      key: "BitsPerComponent",
      value: image.bitsPerComponent
    });

    if ("decodeParameters" in image && typeof image.decodeParameters !== "undefined") {
      additionalKeyValues.push({
        key: "DecodeParms",
        value: "<<" + image.decodeParameters + ">>"
      });
    }

    if ("transparency" in image && Array.isArray(image.transparency)) {
      var transparency = "",
          i = 0,
          len = image.transparency.length;

      for (; i < len; i++) {
        transparency += image.transparency[i] + " " + image.transparency[i] + " ";
      }

      additionalKeyValues.push({
        key: "Mask",
        value: "[" + transparency + "]"
      });
    }

    if (typeof image.sMask !== "undefined") {
      additionalKeyValues.push({
        key: "SMask",
        value: image.objectId + 1 + " 0 R"
      });
    }

    var alreadyAppliedFilters = typeof image.filter !== "undefined" ? ["/" + image.filter] : undefined;
    putStream({
      data: image.data,
      additionalKeyValues: additionalKeyValues,
      alreadyAppliedFilters: alreadyAppliedFilters,
      objectId: image.objectId
    });
    out("endobj"); // Soft mask

    if ("sMask" in image && typeof image.sMask !== "undefined") {
      var decodeParameters = "/Predictor " + image.predictor + " /Colors 1 /BitsPerComponent " + image.bitsPerComponent + " /Columns " + image.width;
      var sMask = {
        width: image.width,
        height: image.height,
        colorSpace: "DeviceGray",
        bitsPerComponent: image.bitsPerComponent,
        decodeParameters: decodeParameters,
        data: image.sMask
      };

      if ("filter" in image) {
        sMask.filter = image.filter;
      }

      putImage.call(this, sMask);
    } //Palette


    if (image.colorSpace === color_spaces.INDEXED) {
      var objId = this.internal.newObject(); //out('<< /Filter / ' + img['f'] +' /Length ' + img['pal'].length + '>>');
      //putStream(zlib.compress(img['pal']));

      putStream({
        data: arrayBufferToBinaryString(new Uint8Array(image.palette)),
        objectId: objId
      });
      out("endobj");
    }
  };

  var putResourcesCallback = function putResourcesCallback() {
    var images = this.internal.collections[namespace + "images"];

    for (var i in images) {
      putImage.call(this, images[i]);
    }
  };

  var putXObjectsDictCallback = function putXObjectsDictCallback() {
    var images = this.internal.collections[namespace + "images"],
        out = this.internal.write,
        image;

    for (var i in images) {
      image = images[i];
      out("/I" + image.index, image.objectId, "0", "R");
    }
  };

  var checkCompressValue = function checkCompressValue(value) {
    if (value && typeof value === "string") value = value.toUpperCase();
    return value in jsPDFAPI.image_compression ? value : image_compression.NONE;
  };

  var initialize = function initialize() {
    if (!this.internal.collections[namespace + "images"]) {
      this.internal.collections[namespace + "images"] = {};
      this.internal.events.subscribe("putResources", putResourcesCallback);
      this.internal.events.subscribe("putXobjectDict", putXObjectsDictCallback);
    }
  };

  var getImages = function getImages() {
    var images = this.internal.collections[namespace + "images"];
    initialize.call(this);
    return images;
  };

  var getImageIndex = function getImageIndex() {
    return Object.keys(this.internal.collections[namespace + "images"]).length;
  };

  var notDefined = function notDefined(value) {
    return typeof value === "undefined" || value === null || value.length === 0;
  };

  var generateAliasFromImageData = function generateAliasFromImageData(imageData) {
    if (typeof imageData === "string" || isArrayBufferView(imageData)) {
      return sHashCode(imageData);
    } else if (isArrayBufferView(imageData.data)) {
      return sHashCode(imageData.data);
    }

    return null;
  };

  var isImageTypeSupported = function isImageTypeSupported(type) {
    return typeof jsPDFAPI["process" + type.toUpperCase()] === "function";
  };

  var checkImagesForAlias = function checkImagesForAlias(alias) {
    var images = this.internal.collections[namespace + "images"];

    if (images) {
      for (var e in images) {
        if (alias === images[e].alias) {
          return images[e];
        }
      }
    }
  };

  var determineWidthAndHeight = function determineWidthAndHeight(width, height, image) {
    if (!width && !height) {
      width = -96;
      height = -96;
    }

    if (width < 0) {
      width = -1 * image.width * 72 / width / this.internal.scaleFactor;
    }

    if (height < 0) {
      height = -1 * image.height * 72 / height / this.internal.scaleFactor;
    }

    if (width === 0) {
      width = height * image.width / image.height;
    }

    if (height === 0) {
      height = width * image.height / image.width;
    }

    return [width, height];
  };

  var writeImageToPDF = function writeImageToPDF(x, y, width, height, image, rotation) {
    var dims = determineWidthAndHeight.call(this, width, height, image),
        coord = this.internal.getCoordinateString,
        vcoord = this.internal.getVerticalCoordinateString;
    var images = getImages.call(this);
    width = dims[0];
    height = dims[1];
    images[image.index] = image;

    if (rotation) {
      rotation *= Math.PI / 180;
      var c = Math.cos(rotation);
      var s = Math.sin(rotation); //like in pdf Reference do it 4 digits instead of 2

      var f4 = function f4(number) {
        return number.toFixed(4);
      };

      var rotationTransformationMatrix = [f4(c), f4(s), f4(s * -1), f4(c), 0, 0, "cm"];
    }

    this.internal.write("q"); //Save graphics state

    if (rotation) {
      this.internal.write([1, "0", "0", 1, coord(x), vcoord(y + height), "cm"].join(" ")); //Translate

      this.internal.write(rotationTransformationMatrix.join(" ")); //Rotate

      this.internal.write([coord(width), "0", "0", coord(height), "0", "0", "cm"].join(" ")); //Scale
    } else {
      this.internal.write([coord(width), "0", "0", coord(height), coord(x), vcoord(y + height), "cm"].join(" ")); //Translate and Scale
    }

    if (this.isAdvancedAPI()) {
      // draw image bottom up when in "advanced" API mode
      this.internal.write([1, 0, 0, -1, 0, 0, "cm"].join(" "));
    }

    this.internal.write("/I" + image.index + " Do"); //Paint Image

    this.internal.write("Q"); //Restore graphics state
  };
  /**
   * COLOR SPACES
   */


  var color_spaces = jsPDFAPI.color_spaces = {
    DEVICE_RGB: "DeviceRGB",
    DEVICE_GRAY: "DeviceGray",
    DEVICE_CMYK: "DeviceCMYK",
    CAL_GREY: "CalGray",
    CAL_RGB: "CalRGB",
    LAB: "Lab",
    ICC_BASED: "ICCBased",
    INDEXED: "Indexed",
    PATTERN: "Pattern",
    SEPARATION: "Separation",
    DEVICE_N: "DeviceN"
  };
  /**
   * DECODE METHODS
   */

  jsPDFAPI.decode = {
    DCT_DECODE: "DCTDecode",
    FLATE_DECODE: "FlateDecode",
    LZW_DECODE: "LZWDecode",
    JPX_DECODE: "JPXDecode",
    JBIG2_DECODE: "JBIG2Decode",
    ASCII85_DECODE: "ASCII85Decode",
    ASCII_HEX_DECODE: "ASCIIHexDecode",
    RUN_LENGTH_DECODE: "RunLengthDecode",
    CCITT_FAX_DECODE: "CCITTFaxDecode"
  };
  /**
   * IMAGE COMPRESSION TYPES
   */

  var image_compression = jsPDFAPI.image_compression = {
    NONE: "NONE",
    FAST: "FAST",
    MEDIUM: "MEDIUM",
    SLOW: "SLOW"
  };
  /**
   * @name sHashCode
   * @function
   * @param {string} data
   * @returns {string}
   */

  var sHashCode = jsPDFAPI.__addimage__.sHashCode = function (data) {
    var hash = 0,
        i,
        len;

    if (typeof data === "string") {
      len = data.length;

      for (i = 0; i < len; i++) {
        hash = (hash << 5) - hash + data.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
    } else if (isArrayBufferView(data)) {
      len = data.byteLength / 2;

      for (i = 0; i < len; i++) {
        hash = (hash << 5) - hash + data[i];
        hash |= 0; // Convert to 32bit integer
      }
    }

    return hash;
  };
  /**
   * Validates if given String is a valid Base64-String
   *
   * @name validateStringAsBase64
   * @public
   * @function
   * @param {String} possible Base64-String
   *
   * @returns {boolean}
   */


  var validateStringAsBase64 = jsPDFAPI.__addimage__.validateStringAsBase64 = function (possibleBase64String) {
    possibleBase64String = possibleBase64String || "";
    possibleBase64String.toString().trim();
    var result = true;

    if (possibleBase64String.length === 0) {
      result = false;
    }

    if (possibleBase64String.length % 4 !== 0) {
      result = false;
    }

    if (/^[A-Za-z0-9+/]+$/.test(possibleBase64String.substr(0, possibleBase64String.length - 2)) === false) {
      result = false;
    }

    if (/^[A-Za-z0-9/][A-Za-z0-9+/]|[A-Za-z0-9+/]=|==$/.test(possibleBase64String.substr(-2)) === false) {
      result = false;
    }

    return result;
  };
  /**
   * Strips out and returns info from a valid base64 data URI
   *
   * @name extractImageFromDataUrl
   * @function
   * @param {string} dataUrl a valid data URI of format 'data:[<MIME-type>][;base64],<data>'
   * @returns {Array}an Array containing the following
   * [0] the complete data URI
   * [1] <MIME-type>
   * [2] format - the second part of the mime-type i.e 'png' in 'image/png'
   * [4] <data>
   */


  var extractImageFromDataUrl = jsPDFAPI.__addimage__.extractImageFromDataUrl = function (dataUrl) {
    dataUrl = dataUrl || "";
    var dataUrlParts = dataUrl.split("base64,");
    var result = null;

    if (dataUrlParts.length === 2) {
      var extractedInfo = /^data:(\w*\/\w*);*(charset=(?!charset=)[\w=-]*)*;*$/.exec(dataUrlParts[0]);

      if (Array.isArray(extractedInfo)) {
        result = {
          mimeType: extractedInfo[1],
          charset: extractedInfo[2],
          data: dataUrlParts[1]
        };
      }
    }

    return result;
  };
  /**
   * Check to see if ArrayBuffer is supported
   *
   * @name supportsArrayBuffer
   * @function
   * @returns {boolean}
   */


  var supportsArrayBuffer = jsPDFAPI.__addimage__.supportsArrayBuffer = function () {
    return typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
  };
  /**
   * Tests supplied object to determine if ArrayBuffer
   *
   * @name isArrayBuffer
   * @function
   * @param {Object} object an Object
   *
   * @returns {boolean}
   */


  jsPDFAPI.__addimage__.isArrayBuffer = function (object) {
    return supportsArrayBuffer() && object instanceof ArrayBuffer;
  };
  /**
   * Tests supplied object to determine if it implements the ArrayBufferView (TypedArray) interface
   *
   * @name isArrayBufferView
   * @function
   * @param {Object} object an Object
   * @returns {boolean}
   */


  var isArrayBufferView = jsPDFAPI.__addimage__.isArrayBufferView = function (object) {
    return supportsArrayBuffer() && typeof Uint32Array !== "undefined" && (object instanceof Int8Array || object instanceof Uint8Array || typeof Uint8ClampedArray !== "undefined" && object instanceof Uint8ClampedArray || object instanceof Int16Array || object instanceof Uint16Array || object instanceof Int32Array || object instanceof Uint32Array || object instanceof Float32Array || object instanceof Float64Array);
  };
  /**
   * Convert Binary String to ArrayBuffer
   *
   * @name binaryStringToUint8Array
   * @public
   * @function
   * @param {string} BinaryString with ImageData
   * @returns {Uint8Array}
   */


  var binaryStringToUint8Array = jsPDFAPI.__addimage__.binaryStringToUint8Array = function (binary_string) {
    var len = binary_string.length;
    var bytes = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }

    return bytes;
  };
  /**
   * Convert the Buffer to a Binary String
   *
   * @name arrayBufferToBinaryString
   * @public
   * @function
   * @param {ArrayBuffer|ArrayBufferView} ArrayBuffer buffer or bufferView with ImageData
   *
   * @returns {String}
   */


  var arrayBufferToBinaryString = jsPDFAPI.__addimage__.arrayBufferToBinaryString = function (buffer) {
    var out = ""; // There are calls with both ArrayBuffer and already converted Uint8Array or other BufferView.
    // Do not copy the array if input is already an array.

    var buf = isArrayBufferView(buffer) ? buffer : new Uint8Array(buffer);

    for (var i = 0; i < buf.length; i += ARRAY_APPLY_BATCH) {
      // Limit the amount of characters being parsed to prevent overflow.
      // Note that while TextDecoder would be faster, it does not have the same
      // functionality as fromCharCode with any provided encodings as of 3/2021.
      out += String.fromCharCode.apply(null, buf.subarray(i, i + ARRAY_APPLY_BATCH));
    }

    return out;
  };
  /**
   * Possible parameter for addImage, an RGBA buffer with size.
   *
   * @typedef {Object} RGBAData
   * @property {Uint8ClampedArray} data - Single dimensional array of RGBA values. For example from canvas getImageData.
   * @property {number} width - Image width as the data does not carry this information in itself.
   * @property {number} height - Image height as the data does not carry this information in itself.
   */

  /**
   * Adds an Image to the PDF.
   *
   * @name addImage
   * @public
   * @function
   * @param {string|HTMLImageElement|HTMLCanvasElement|Uint8Array|RGBAData} imageData imageData as base64 encoded DataUrl or Image-HTMLElement or Canvas-HTMLElement or object containing RGBA array (like output from canvas.getImageData).
   * @param {string} format format of file if filetype-recognition fails or in case of a Canvas-Element needs to be specified (default for Canvas is JPEG), e.g. 'JPEG', 'PNG', 'WEBP'
   * @param {number} x x Coordinate (in units declared at inception of PDF document) against left edge of the page
   * @param {number} y y Coordinate (in units declared at inception of PDF document) against upper edge of the page
   * @param {number} width width of the image (in units declared at inception of PDF document)
   * @param {number} height height of the Image (in units declared at inception of PDF document)
   * @param {string} alias alias of the image (if used multiple times)
   * @param {string} compression compression of the generated JPEG, can have the values 'NONE', 'FAST', 'MEDIUM' and 'SLOW'
   * @param {number} rotation rotation of the image in degrees (0-359)
   *
   * @returns jsPDF
   */


  jsPDFAPI.addImage = function () {
    var imageData, format, x, y, w, h, alias, compression, rotation;
    imageData = arguments[0];
    format = arguments[1];
    x = arguments[2];
    y = arguments[3];
    w = arguments[4];
    h = arguments[5];
    alias = arguments[6];
    compression = arguments[7];
    rotation = arguments[8]; //If compression is not explicitly set, determine if we should use compression

    var filter = this.internal.getFilters();

    if (compression === undefined && filter.indexOf("FlateEncode") !== -1) {
      compression = "SLOW";
    }

    if (isNaN(x) || isNaN(y)) {
      throw new Error("Invalid coordinates passed to jsPDF.addImage");
    }

    initialize.call(this);
    var image = processImageData.call(this, imageData, format, alias, compression);
    writeImageToPDF.call(this, x, y, w, h, image, rotation);
    return this;
  };

  var processImageData = function processImageData(imageData, format, alias, compression) {
    var result, dataAsBinaryString;
    imageData = unescape(imageData);
    var tmpImageData = convertBase64ToBinaryString(imageData, false);
    imageData = tmpImageData;
    format = "PNG";

    if (!isImageTypeSupported(format)) {
      throw new Error("addImage does not support files of type '" + format + "', please ensure that a plugin for '" + format + "' support is added.");
    } // now do the heavy lifting


    if (notDefined(alias)) {
      alias = generateAliasFromImageData(imageData);
    }

    result = checkImagesForAlias.call(this, alias);

    if (!result) {
      if (supportsArrayBuffer()) {
        // no need to convert if imageData is already uint8array
        if (!(imageData instanceof Uint8Array) && format !== "RGBA") {
          dataAsBinaryString = imageData;
          imageData = binaryStringToUint8Array(imageData);
        }
      }

      result = this["process" + format.toUpperCase()](imageData, getImageIndex.call(this), alias, checkCompressValue(compression), dataAsBinaryString);
    }

    if (!result) {
      throw new Error("An unknown error occurred whilst processing the image.");
    }

    return result;
  };
  /**
   * @name convertBase64ToBinaryString
   * @function
   * @param {string} stringData
   * @returns {string} binary string
   */


  var convertBase64ToBinaryString = jsPDFAPI.__addimage__.convertBase64ToBinaryString = function (stringData, throwError) {
    throwError = typeof throwError === "boolean" ? throwError : true;
    var base64Info;
    var imageData = "";
    var rawData;

    if (typeof stringData === "string") {
      base64Info = extractImageFromDataUrl(stringData);
      rawData = base64Info !== null ? base64Info.data : stringData;

      try {
        imageData = atob(rawData);
      } catch (e) {
        if (throwError) {
          if (!validateStringAsBase64(rawData)) {
            throw new Error("Supplied Data is not a valid base64-String jsPDF.convertBase64ToBinaryString ");
          } else {
            throw new Error("atob-Error in jsPDF.convertBase64ToBinaryString " + e.message);
          }
        }
      }
    }

    return imageData;
  };
  /**
   * @name getImageProperties
   * @function
   * @param {Object} imageData
   * @returns {Object}
   */


  jsPDFAPI.getImageProperties = function (imageData) {
    var image;
    var tmpImageData = "";
    var format = "PNG";
    tmpImageData = convertBase64ToBinaryString(imageData, false);
    imageData = tmpImageData;

    if (!isImageTypeSupported(format)) {
      throw new Error("addImage does not support files of type '" + format + "', please ensure that a plugin for '" + format + "' support is added.");
    }

    if (supportsArrayBuffer() && !(imageData instanceof Uint8Array)) {
      imageData = binaryStringToUint8Array(imageData);
    }

    image = this["process" + format.toUpperCase()](imageData);

    if (!image) {
      throw new Error("An unknown error occurred whilst processing the image");
    }

    image.fileType = format;
    return image;
  };
})(jsPDF.API);

// Generated by CoffeeScript 1.4.0

var PNG = function () {
  var APNG_BLEND_OP_SOURCE, APNG_DISPOSE_OP_BACKGROUND, APNG_DISPOSE_OP_PREVIOUS, makeImage, scratchCanvas, scratchCtx;
  APNG_DISPOSE_OP_BACKGROUND = 1;
  APNG_DISPOSE_OP_PREVIOUS = 2;
  APNG_BLEND_OP_SOURCE = 0;

  function PNG(data) {
    var chunkSize, colors, palLen, delayDen, delayNum, frame, i, index, key, section, palShort, text, _i, _j, _ref;

    this.data = data;
    this.pos = 8;
    this.palette = [];
    this.imgData = [];
    this.transparency = {};
    this.animation = null;
    this.text = {};
    frame = null;

    while (true) {
      chunkSize = this.readUInt32();

      section = function () {
        var _i, _results;

        _results = [];

        for (i = _i = 0; _i < 4; i = ++_i) {
          _results.push(String.fromCharCode(this.data[this.pos++]));
        }

        return _results;
      }.call(this).join("");

      switch (section) {
        case "IHDR":
          this.width = this.readUInt32();
          this.height = this.readUInt32();
          this.bits = this.data[this.pos++];
          this.colorType = this.data[this.pos++];
          this.compressionMethod = this.data[this.pos++];
          this.filterMethod = this.data[this.pos++];
          this.interlaceMethod = this.data[this.pos++];
          break;

        case "acTL":
          this.animation = {
            numFrames: this.readUInt32(),
            numPlays: this.readUInt32() || Infinity,
            frames: []
          };
          break;

        case "PLTE":
          this.palette = this.read(chunkSize);
          break;

        case "fcTL":
          if (frame) {
            this.animation.frames.push(frame);
          }

          this.pos += 4;
          frame = {
            width: this.readUInt32(),
            height: this.readUInt32(),
            xOffset: this.readUInt32(),
            yOffset: this.readUInt32()
          };
          delayNum = this.readUInt16();
          delayDen = this.readUInt16() || 100;
          frame.delay = 1000 * delayNum / delayDen;
          frame.disposeOp = this.data[this.pos++];
          frame.blendOp = this.data[this.pos++];
          frame.data = [];
          break;

        case "IDAT":
        case "fdAT":
          if (section === "fdAT") {
            this.pos += 4;
            chunkSize -= 4;
          }

          data = (frame != null ? frame.data : void 0) || this.imgData;

          for (i = _i = 0; 0 <= chunkSize ? _i < chunkSize : _i > chunkSize; i = 0 <= chunkSize ? ++_i : --_i) {
            data.push(this.data[this.pos++]);
          }

          break;

        case "tRNS":
          this.transparency = {};

          switch (this.colorType) {
            case 3:
              palLen = this.palette.length / 3;
              this.transparency.indexed = this.read(chunkSize);
              if (this.transparency.indexed.length > palLen) throw new Error("More transparent colors than palette size");
              /*
               * According to the PNG spec trns should be increased to the same size as palette if shorter
               */
              //palShort = 255 - this.transparency.indexed.length;

              palShort = palLen - this.transparency.indexed.length;

              if (palShort > 0) {
                for (i = _j = 0; 0 <= palShort ? _j < palShort : _j > palShort; i = 0 <= palShort ? ++_j : --_j) {
                  this.transparency.indexed.push(255);
                }
              }

              break;

            case 0:
              this.transparency.grayscale = this.read(chunkSize)[0];
              break;

            case 2:
              this.transparency.rgb = this.read(chunkSize);
          }

          break;

        case "tEXt":
          text = this.read(chunkSize);
          index = text.indexOf(0);
          key = String.fromCharCode.apply(String, text.slice(0, index));
          this.text[key] = String.fromCharCode.apply(String, text.slice(index + 1));
          break;

        case "IEND":
          if (frame) {
            this.animation.frames.push(frame);
          }

          this.colors = function () {
            switch (this.colorType) {
              case 0:
              case 3:
              case 4:
                return 1;

              case 2:
              case 6:
                return 3;
            }
          }.call(this);

          this.hasAlphaChannel = (_ref = this.colorType) === 4 || _ref === 6;
          colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
          this.pixelBitlength = this.bits * colors;

          this.colorSpace = function () {
            switch (this.colors) {
              case 1:
                return "DeviceGray";

              case 3:
                return "DeviceRGB";
            }
          }.call(this);

          this.imgData = new Uint8Array(this.imgData);
          return;

        default:
          this.pos += chunkSize;
      }

      this.pos += 4;

      if (this.pos > this.data.length) {
        throw new Error("Incomplete or corrupt PNG file");
      }
    }
  }

  PNG.prototype.read = function (bytes) {
    var i, _i, _results;

    _results = [];

    for (i = _i = 0; 0 <= bytes ? _i < bytes : _i > bytes; i = 0 <= bytes ? ++_i : --_i) {
      _results.push(this.data[this.pos++]);
    }

    return _results;
  };

  PNG.prototype.readUInt32 = function () {
    var b1, b2, b3, b4;
    b1 = this.data[this.pos++] << 24;
    b2 = this.data[this.pos++] << 16;
    b3 = this.data[this.pos++] << 8;
    b4 = this.data[this.pos++];
    return b1 | b2 | b3 | b4;
  };

  PNG.prototype.readUInt16 = function () {
    var b1, b2;
    b1 = this.data[this.pos++] << 8;
    b2 = this.data[this.pos++];
    return b1 | b2;
  };

  PNG.prototype.decodePixels = function (data) {
    var pixelBytes = this.pixelBitlength / 8;
    var fullPixels = new Uint8Array(this.width * this.height * pixelBytes);
    var pos = 0;

    var _this = this;

    if (data == null) {
      data = this.imgData;
    }

    if (data.length === 0) {
      return new Uint8Array(0);
    }

    data = unzlibSync(data);

    function pass(x0, y0, dx, dy) {
      var abyte, c, col, i, left, length, p, pa, paeth, pb, pc, pixels, row, scanlineLength, upper, upperLeft, _i, _j, _k, _l, _m;

      var w = Math.ceil((_this.width - x0) / dx),
          h = Math.ceil((_this.height - y0) / dy);
      var isFull = _this.width == w && _this.height == h;
      scanlineLength = pixelBytes * w;
      pixels = isFull ? fullPixels : new Uint8Array(scanlineLength * h);
      length = data.length;
      row = 0;
      c = 0;

      while (row < h && pos < length) {
        switch (data[pos++]) {
          case 0:
            for (i = _i = 0; _i < scanlineLength; i = _i += 1) {
              pixels[c++] = data[pos++];
            }

            break;

          case 1:
            for (i = _j = 0; _j < scanlineLength; i = _j += 1) {
              abyte = data[pos++];
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
              pixels[c++] = (abyte + left) % 256;
            }

            break;

          case 2:
            for (i = _k = 0; _k < scanlineLength; i = _k += 1) {
              abyte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
              pixels[c++] = (upper + abyte) % 256;
            }

            break;

          case 3:
            for (i = _l = 0; _l < scanlineLength; i = _l += 1) {
              abyte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
              upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
              pixels[c++] = (abyte + Math.floor((left + upper) / 2)) % 256;
            }

            break;

          case 4:
            for (i = _m = 0; _m < scanlineLength; i = _m += 1) {
              abyte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : pixels[c - pixelBytes];

              if (row === 0) {
                upper = upperLeft = 0;
              } else {
                upper = pixels[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
                upperLeft = col && pixels[(row - 1) * scanlineLength + (col - 1) * pixelBytes + i % pixelBytes];
              }

              p = left + upper - upperLeft;
              pa = Math.abs(p - left);
              pb = Math.abs(p - upper);
              pc = Math.abs(p - upperLeft);

              if (pa <= pb && pa <= pc) {
                paeth = left;
              } else if (pb <= pc) {
                paeth = upper;
              } else {
                paeth = upperLeft;
              }

              pixels[c++] = (abyte + paeth) % 256;
            }

            break;

          default:
            throw new Error("Invalid filter algorithm: " + data[pos - 1]);
        }

        if (!isFull) {
          var fullPos = ((y0 + row * dy) * _this.width + x0) * pixelBytes;
          var partPos = row * scanlineLength;

          for (i = 0; i < w; i += 1) {
            for (var j = 0; j < pixelBytes; j += 1) {
              fullPixels[fullPos++] = pixels[partPos++];
            }

            fullPos += (dx - 1) * pixelBytes;
          }
        }

        row++;
      }
    }

    if (_this.interlaceMethod == 1) {
      /*
          1 6 4 6 2 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
          3 6 4 6 3 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
        */
      pass(0, 0, 8, 8); // 1

      /* NOTE these seem to follow the pattern:
       * pass(x, 0, 2*x, 2*x);
       * pass(0, x,   x, 2*x);
       * with x being 4, 2, 1.
       */

      pass(4, 0, 8, 8); // 2

      pass(0, 4, 4, 8); // 3

      pass(2, 0, 4, 4); // 4

      pass(0, 2, 2, 4); // 5

      pass(1, 0, 2, 2); // 6

      pass(0, 1, 1, 2); // 7
    } else {
      pass(0, 0, 1, 1);
    }

    return fullPixels;
  };

  PNG.prototype.decodePalette = function () {
    var c, i, length, palette, pos, ret, transparency, _i, _ref, _ref1;

    palette = this.palette;
    transparency = this.transparency.indexed || [];
    ret = new Uint8Array((transparency.length || 0) + palette.length);
    pos = 0;
    length = palette.length;
    c = 0;

    for (i = _i = 0, _ref = length; _i < _ref; i = _i += 3) {
      ret[pos++] = palette[i];
      ret[pos++] = palette[i + 1];
      ret[pos++] = palette[i + 2];
      ret[pos++] = (_ref1 = transparency[c++]) != null ? _ref1 : 255;
    }

    return ret;
  };

  PNG.prototype.copyToImageData = function (imageData, pixels) {
    var alpha, colors, data, i, input, j, k, length, palette, v, _ref;

    colors = this.colors;
    palette = null;
    alpha = this.hasAlphaChannel;

    if (this.palette.length) {
      palette = (_ref = this._decodedPalette) != null ? _ref : this._decodedPalette = this.decodePalette();
      colors = 4;
      alpha = true;
    }

    data = imageData.data || imageData;
    length = data.length;
    input = palette || pixels;
    i = j = 0;

    if (colors === 1) {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        v = input[k++];
        data[i++] = v;
        data[i++] = v;
        data[i++] = v;
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    } else {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    }
  };

  PNG.prototype.decode = function () {
    var ret;
    ret = new Uint8Array(this.width * this.height * 4);
    this.copyToImageData(ret, this.decodePixels());
    return ret;
  };

  var hasBrowserCanvas = function hasBrowserCanvas() {
    if (Object.prototype.toString.call(globalObject) === "[object Window]") {
      try {
        scratchCanvas = globalObject.document.createElement("canvas");
        scratchCtx = scratchCanvas.getContext("2d");
      } catch (e) {
        return false;
      }

      return true;
    }

    return false;
  };

  hasBrowserCanvas();

  makeImage = function makeImage(imageData) {
    if (hasBrowserCanvas() === true) {
      var img;
      scratchCtx.width = imageData.width;
      scratchCtx.height = imageData.height;
      scratchCtx.clearRect(0, 0, imageData.width, imageData.height);
      scratchCtx.putImageData(imageData, 0, 0);
      img = new Image();
      img.src = scratchCanvas.toDataURL();
      return img;
    }

    throw new Error("This method requires a Browser with Canvas-capability.");
  };

  PNG.prototype.decodeFrames = function (ctx) {
    var frame, i, imageData, pixels, _i, _len, _ref, _results;

    if (!this.animation) {
      return;
    }

    _ref = this.animation.frames;
    _results = [];

    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      frame = _ref[i];
      imageData = ctx.createImageData(frame.width, frame.height);
      pixels = this.decodePixels(new Uint8Array(frame.data));
      this.copyToImageData(imageData, pixels);
      frame.imageData = imageData;

      _results.push(frame.image = makeImage(imageData));
    }

    return _results;
  };

  PNG.prototype.renderFrame = function (ctx, number) {
    var frame, frames, prev;
    frames = this.animation.frames;
    frame = frames[number];
    prev = frames[number - 1];

    if (number === 0) {
      ctx.clearRect(0, 0, this.width, this.height);
    }

    if ((prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_BACKGROUND) {
      ctx.clearRect(prev.xOffset, prev.yOffset, prev.width, prev.height);
    } else if ((prev != null ? prev.disposeOp : void 0) === APNG_DISPOSE_OP_PREVIOUS) {
      ctx.putImageData(prev.imageData, prev.xOffset, prev.yOffset);
    }

    if (frame.blendOp === APNG_BLEND_OP_SOURCE) {
      ctx.clearRect(frame.xOffset, frame.yOffset, frame.width, frame.height);
    }

    return ctx.drawImage(frame.image, frame.xOffset, frame.yOffset);
  };

  PNG.prototype.animate = function (ctx) {
    var _doFrame,
        frameNumber,
        frames,
        numFrames,
        numPlays,
        _ref,
        _this = this;

    frameNumber = 0;
    _ref = this.animation, numFrames = _ref.numFrames, frames = _ref.frames, numPlays = _ref.numPlays;
    return (_doFrame = function doFrame() {
      var f, frame;
      f = frameNumber++ % numFrames;
      frame = frames[f];

      _this.renderFrame(ctx, f);

      if (numFrames > 1 && frameNumber / numFrames < numPlays) {
        return _this.animation._timeout = setTimeout(_doFrame, frame.delay);
      }
    })();
  };

  PNG.prototype.stopAnimation = function () {
    var _ref;

    return clearTimeout((_ref = this.animation) != null ? _ref._timeout : void 0);
  };

  PNG.prototype.render = function (canvas) {
    var ctx, data;

    if (canvas._png) {
      canvas._png.stopAnimation();
    }

    canvas._png = this;
    canvas.width = this.width;
    canvas.height = this.height;
    ctx = canvas.getContext("2d");

    if (this.animation) {
      this.decodeFrames(ctx);
      return this.animate(ctx);
    } else {
      data = ctx.createImageData(this.width, this.height);
      this.copyToImageData(data, this.decodePixels());
      return ctx.putImageData(data, 0, 0);
    }
  };

  return PNG;
}();

/**
 * @license
 *
 * Copyright (c) 2014 James Robb, https://github.com/jamesbrobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */
/**
 * jsPDF PNG PlugIn
 * @name png_support
 * @module
 */

(function (jsPDFAPI) {
  /*
   * @see http://www.w3.org/TR/PNG-Chunks.html
   *
   Color    Allowed      Interpretation
   Type     Bit Depths
      0       1,2,4,8,16  Each pixel is a grayscale sample.
      2       8,16        Each pixel is an R,G,B triple.
      3       1,2,4,8     Each pixel is a palette index;
                         a PLTE chunk must appear.
      4       8,16        Each pixel is a grayscale sample,
                         followed by an alpha sample.
      6       8,16        Each pixel is an R,G,B triple,
                         followed by an alpha sample.
  */

  /*
   * PNG filter method types
   *
   * @see http://www.w3.org/TR/PNG-Filters.html
   * @see http://www.libpng.org/pub/png/book/chapter09.html
   *
   * This is what the value 'Predictor' in decode params relates to
   *
   * 15 is "optimal prediction", which means the prediction algorithm can change from line to line.
   * In that case, you actually have to read the first byte off each line for the prediction algorthim (which should be 0-4, corresponding to PDF 10-14) and select the appropriate unprediction algorithm based on that byte.
   *
     0       None
     1       Sub
     2       Up
     3       Average
     4       Paeth
   */

  var canCompress = function canCompress(value) {
    return value !== jsPDFAPI.image_compression.NONE && hasCompressionJS();
  };

  var hasCompressionJS = function hasCompressionJS() {
    return typeof zlibSync === "function";
  };

  var compressBytes = function compressBytes(bytes, lineLength, colorsPerPixel, compression) {
    var level = 4;
    var filter_method = filterUp;

    switch (compression) {
      case jsPDFAPI.image_compression.FAST:
        level = 1;
        filter_method = filterSub;
        break;

      case jsPDFAPI.image_compression.MEDIUM:
        level = 6;
        filter_method = filterAverage;
        break;

      case jsPDFAPI.image_compression.SLOW:
        level = 9;
        filter_method = filterPaeth;
        break;
    }

    bytes = applyPngFilterMethod(bytes, lineLength, colorsPerPixel, filter_method);
    var dat = zlibSync(bytes, {
      level: level
    });
    return jsPDFAPI.__addimage__.arrayBufferToBinaryString(dat);
  };

  var applyPngFilterMethod = function applyPngFilterMethod(bytes, lineLength, colorsPerPixel, filter_method) {
    var lines = bytes.length / lineLength,
        result = new Uint8Array(bytes.length + lines),
        filter_methods = getFilterMethods(),
        line,
        prevLine,
        offset;

    for (var i = 0; i < lines; i += 1) {
      offset = i * lineLength;
      line = bytes.subarray(offset, offset + lineLength);

      if (filter_method) {
        result.set(filter_method(line, colorsPerPixel, prevLine), offset + i);
      } else {
        var len = filter_methods.length,
            results = [];

        for (var j; j < len; j += 1) {
          results[j] = filter_methods[j](line, colorsPerPixel, prevLine);
        }

        var ind = getIndexOfSmallestSum(results.concat());
        result.set(results[ind], offset + i);
      }

      prevLine = line;
    }

    return result;
  };

  var filterNone = function filterNone(line) {
    /*var result = new Uint8Array(line.length + 1);
    result[0] = 0;
    result.set(line, 1);*/
    var result = Array.apply([], line);
    result.unshift(0);
    return result;
  };

  var filterSub = function filterSub(line, colorsPerPixel) {
    var result = [],
        len = line.length,
        left;
    result[0] = 1;

    for (var i = 0; i < len; i += 1) {
      left = line[i - colorsPerPixel] || 0;
      result[i + 1] = line[i] - left + 0x0100 & 0xff;
    }

    return result;
  };

  var filterUp = function filterUp(line, colorsPerPixel, prevLine) {
    var result = [],
        len = line.length,
        up;
    result[0] = 2;

    for (var i = 0; i < len; i += 1) {
      up = prevLine && prevLine[i] || 0;
      result[i + 1] = line[i] - up + 0x0100 & 0xff;
    }

    return result;
  };

  var filterAverage = function filterAverage(line, colorsPerPixel, prevLine) {
    var result = [],
        len = line.length,
        left,
        up;
    result[0] = 3;

    for (var i = 0; i < len; i += 1) {
      left = line[i - colorsPerPixel] || 0;
      up = prevLine && prevLine[i] || 0;
      result[i + 1] = line[i] + 0x0100 - (left + up >>> 1) & 0xff;
    }

    return result;
  };

  var filterPaeth = function filterPaeth(line, colorsPerPixel, prevLine) {
    var result = [],
        len = line.length,
        left,
        up,
        upLeft,
        paeth;
    result[0] = 4;

    for (var i = 0; i < len; i += 1) {
      left = line[i - colorsPerPixel] || 0;
      up = prevLine && prevLine[i] || 0;
      upLeft = prevLine && prevLine[i - colorsPerPixel] || 0;
      paeth = paethPredictor(left, up, upLeft);
      result[i + 1] = line[i] - paeth + 0x0100 & 0xff;
    }

    return result;
  };

  var paethPredictor = function paethPredictor(left, up, upLeft) {
    if (left === up && up === upLeft) {
      return left;
    }

    var pLeft = Math.abs(up - upLeft),
        pUp = Math.abs(left - upLeft),
        pUpLeft = Math.abs(left + up - upLeft - upLeft);
    return pLeft <= pUp && pLeft <= pUpLeft ? left : pUp <= pUpLeft ? up : upLeft;
  };

  var getFilterMethods = function getFilterMethods() {
    return [filterNone, filterSub, filterUp, filterAverage, filterPaeth];
  };

  var getIndexOfSmallestSum = function getIndexOfSmallestSum(arrays) {
    var sum = arrays.map(function (value) {
      return value.reduce(function (pv, cv) {
        return pv + Math.abs(cv);
      }, 0);
    });
    return sum.indexOf(Math.min.apply(null, sum));
  };

  var getPredictorFromCompression = function getPredictorFromCompression(compression) {
    var predictor;

    switch (compression) {
      case jsPDFAPI.image_compression.FAST:
        predictor = 11;
        break;

      case jsPDFAPI.image_compression.MEDIUM:
        predictor = 13;
        break;

      case jsPDFAPI.image_compression.SLOW:
        predictor = 14;
        break;

      default:
        predictor = 12;
        break;
    }

    return predictor;
  };
  /**
   * @name processPNG
   * @function
   * @ignore
   */


  jsPDFAPI.processPNG = function (imageData, index, alias, compression) {

    var colorSpace,
        filter = this.decode.FLATE_DECODE,
        bitsPerComponent,
        image,
        decodeParameters = "",
        trns,
        colors,
        pal,
        smask,
        pixels,
        len,
        alphaData,
        imgData,
        hasColors,
        pixel,
        i,
        n;
    if (this.__addimage__.isArrayBuffer(imageData)) imageData = new Uint8Array(imageData);

    if (this.__addimage__.isArrayBufferView(imageData)) {
      image = new PNG(imageData);
      imageData = image.imgData;
      bitsPerComponent = image.bits;
      colorSpace = image.colorSpace;
      colors = image.colors;
      /*
       * colorType 6 - Each pixel is an R,G,B triple, followed by an alpha sample.
       *
       * colorType 4 - Each pixel is a grayscale sample, followed by an alpha sample.
       *
       * Extract alpha to create two separate images, using the alpha as a sMask
       */

      if ([4, 6].indexOf(image.colorType) !== -1) {
        /*
         * processes 8 bit RGBA and grayscale + alpha images
         */
        if (image.bits === 8) {
          pixels = image.pixelBitlength == 32 ? new Uint32Array(image.decodePixels().buffer) : image.pixelBitlength == 16 ? new Uint16Array(image.decodePixels().buffer) : new Uint8Array(image.decodePixels().buffer);
          len = pixels.length;
          imgData = new Uint8Array(len * image.colors);
          alphaData = new Uint8Array(len);
          var pDiff = image.pixelBitlength - image.bits;
          i = 0;
          n = 0;
          var pbl;

          for (; i < len; i++) {
            pixel = pixels[i];
            pbl = 0;

            while (pbl < pDiff) {
              imgData[n++] = pixel >>> pbl & 0xff;
              pbl = pbl + image.bits;
            }

            alphaData[i] = pixel >>> pbl & 0xff;
          }
        }
        /*
         * processes 16 bit RGBA and grayscale + alpha images
         */


        if (image.bits === 16) {
          pixels = new Uint32Array(image.decodePixels().buffer);
          len = pixels.length;
          imgData = new Uint8Array(len * (32 / image.pixelBitlength) * image.colors);
          alphaData = new Uint8Array(len * (32 / image.pixelBitlength));
          hasColors = image.colors > 1;
          i = 0;
          n = 0;
          var a = 0;

          while (i < len) {
            pixel = pixels[i++];
            imgData[n++] = pixel >>> 0 & 0xff;

            if (hasColors) {
              imgData[n++] = pixel >>> 16 & 0xff;
              pixel = pixels[i++];
              imgData[n++] = pixel >>> 0 & 0xff;
            }

            alphaData[a++] = pixel >>> 16 & 0xff;
          }

          bitsPerComponent = 8;
        }

        if (canCompress(compression)) {
          imageData = compressBytes(imgData, image.width * image.colors, image.colors, compression);
          smask = compressBytes(alphaData, image.width, 1, compression);
        } else {
          imageData = imgData;
          smask = alphaData;
          filter = undefined;
        }
      }
      /*
       * Indexed png. Each pixel is a palette index.
       */


      if (image.colorType === 3) {
        colorSpace = this.color_spaces.INDEXED;
        pal = image.palette;

        if (image.transparency.indexed) {
          var trans = image.transparency.indexed;
          var total = 0;
          i = 0;
          len = trans.length;

          for (; i < len; ++i) {
            total += trans[i];
          }

          total = total / 255;
          /*
           * a single color is specified as 100% transparent (0),
           * so we set trns to use a /Mask with that index
           */

          if (total === len - 1 && trans.indexOf(0) !== -1) {
            trns = [trans.indexOf(0)];
            /*
             * there's more than one colour within the palette that specifies
             * a transparency value less than 255, so we unroll the pixels to create an image sMask
             */
          } else if (total !== len) {
            pixels = image.decodePixels();
            alphaData = new Uint8Array(pixels.length);
            i = 0;
            len = pixels.length;

            for (; i < len; i++) {
              alphaData[i] = trans[pixels[i]];
            }

            smask = compressBytes(alphaData, image.width, 1);
          }
        }
      }

      var predictor = getPredictorFromCompression(compression);

      if (filter === this.decode.FLATE_DECODE) {
        decodeParameters = "/Predictor " + predictor + " ";
      }

      decodeParameters += "/Colors " + colors + " /BitsPerComponent " + bitsPerComponent + " /Columns " + image.width;

      if (this.__addimage__.isArrayBuffer(imageData) || this.__addimage__.isArrayBufferView(imageData)) {
        imageData = this.__addimage__.arrayBufferToBinaryString(imageData);
      }

      if (smask && this.__addimage__.isArrayBuffer(smask) || this.__addimage__.isArrayBufferView(smask)) {
        smask = this.__addimage__.arrayBufferToBinaryString(smask);
      }

      return {
        alias: alias,
        data: imageData,
        index: index,
        filter: filter,
        decodeParameters: decodeParameters,
        transparency: trns,
        palette: pal,
        sMask: smask,
        predictor: predictor,
        width: image.width,
        height: image.height,
        bitsPerComponent: bitsPerComponent,
        colorSpace: colorSpace
      };
    }
  };
})(jsPDF.API);

function png2pdf(config) {
  var orientation = config.pageWidth > config.pageHeight ? "l" : "p";
  var doc = new jsPDF({
    format: [config.pageWidth, config.pageHeight],
    orientation: orientation
  });

  for (var i = 0, iLen = config.pages.length; i < iLen; i++) {
    var images = config.pages[i];

    for (var p = 0, pLen = images.length; p < pLen; p++) {
      var image = images[p];
      doc.addImage(image.dataUrl, "PNG", image.x, image.y, image.w, image.h);
    }

    if (i < iLen - 1) {
      doc.addPage();
    }
  }

  return doc.output("arraybuffer");
}

export { png2pdf };
//# sourceMappingURL=png2pdf.es.js.map
