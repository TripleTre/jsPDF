/* eslint-disable no-console */

// @if MODULE_FORMAT!='cjs'
// @endif
import { globalObject } from "./libs/globalObject.js";
import { btoa } from "./libs/AtobBtoa.js";
import { console } from "./libs/console.js";
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
  if (typeof context !== "object") {
    throw new Error(
      "Invalid Context passed to initialize PubSub (jsPDF-module)"
    );
  }
  var topics = {};

  this.subscribe = function(topic, callback, once) {
    once = once || false;
    if (
      typeof topic !== "string" ||
      typeof callback !== "function" ||
      typeof once !== "boolean"
    ) {
      throw new Error(
        "Invalid arguments passed to PubSub.subscribe (jsPDF-module)"
      );
    }

    if (!topics.hasOwnProperty(topic)) {
      topics[topic] = {};
    }

    var token = Math.random().toString(35);
    topics[topic][token] = [callback, !!once];

    return token;
  };

  this.unsubscribe = function(token) {
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

  this.publish = function(topic) {
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

  this.getTopics = function() {
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

  if (typeof options === "object") {
    orientation = options.orientation;
    unit = options.unit || unit;
    format = options.format || format;
    compressPdf = options.compress || options.compressPdf || compressPdf;
    userUnit =
      typeof options.userUnit === "number" ? Math.abs(options.userUnit) : 1.0;
    if (typeof options.precision !== "undefined") {
      precision = options.precision;
    }
    if (typeof options.floatPrecision !== "undefined") {
      floatPrecision = options.floatPrecision;
    }
  }

  filters =
    options.filters || (compressPdf === true ? ["FlateEncode"] : filters);

  unit = unit || "mm";
  orientation = ("" + (orientation || "P")).toLowerCase();

  var API = {
    internal: {},
    __private__: {}
  };

  API.__private__.PubSub = PubSub;

  var pdfVersion = "1.3";
  var getPdfVersion = (API.__private__.getPdfVersion = function() {
    return pdfVersion;
  });

  API.__private__.setPdfVersion = function(value) {
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
  API.isAdvancedAPI = function() {
    return apiMode === ApiMode.ADVANCED;
  };

  var roundToPrecision = (API.roundToPrecision = API.__private__.roundToPrecision = function(
    number,
    parmPrecision
  ) {
    var tmpPrecision = precision || parmPrecision;
    if (isNaN(number) || isNaN(tmpPrecision)) {
      throw new Error("Invalid argument passed to jsPDF.roundToPrecision");
    }
    return number.toFixed(tmpPrecision).replace(/0+$/, "");
  });

  // high precision float
  var hpf = (API.hpf = API.__private__.hpf = function(number) {
    if (isNaN(number)) {
      throw new Error("Invalid argument passed to jsPDF.hpf");
    }
    return roundToPrecision(number, floatPrecision);
  });

  var scale = (API.scale = API.__private__.scale = function(number) {
    if (isNaN(number)) {
      throw new Error("Invalid argument passed to jsPDF.scale");
    }
    if (apiMode === ApiMode.COMPAT) {
      return number * scaleFactor;
    } else if (apiMode === ApiMode.ADVANCED) {
      return number;
    }
  });

  var fileId = "00000000000000000000000000000000";

  var getFileId = (API.__private__.getFileId = function() {
    return fileId;
  });

  var setFileId = (API.__private__.setFileId = function(value) {
    if (typeof value !== "undefined" && /^[a-fA-F0-9]{32}$/.test(value)) {
      fileId = value.toUpperCase();
    } else {
      fileId = fileId
        .split("")
        .map(function() {
          return "ABCDEF0123456789".charAt(Math.floor(Math.random() * 16));
        })
        .join("");
    }
    return fileId;
  });

  /**
   * @name setFileId
   * @memberof jsPDF#
   * @function
   * @instance
   * @param {string} value GUID.
   * @returns {jsPDF}
   */
  API.setFileId = function(value) {
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
  API.getFileId = function() {
    return getFileId();
  };

  var creationDate;

  var convertDateToPDFDate = (API.__private__.convertDateToPDFDate = function(
    parmDate
  ) {
    var result = "";
    var tzoffset = parmDate.getTimezoneOffset(),
      tzsign = tzoffset < 0 ? "+" : "-",
      tzhour = Math.floor(Math.abs(tzoffset / 60)),
      tzmin = Math.abs(tzoffset % 60),
      timeZoneString = [tzsign, padd2(tzhour), "'", padd2(tzmin), "'"].join("");

    result = [
      "D:",
      parmDate.getFullYear(),
      padd2(parmDate.getMonth() + 1),
      padd2(parmDate.getDate()),
      padd2(parmDate.getHours()),
      padd2(parmDate.getMinutes()),
      padd2(parmDate.getSeconds()),
      timeZoneString
    ].join("");
    return result;
  });

  var convertPDFDateToDate = (API.__private__.convertPDFDateToDate = function(
    parmPDFDate
  ) {
    var year = parseInt(parmPDFDate.substr(2, 4), 10);
    var month = parseInt(parmPDFDate.substr(6, 2), 10) - 1;
    var date = parseInt(parmPDFDate.substr(8, 2), 10);
    var hour = parseInt(parmPDFDate.substr(10, 2), 10);
    var minutes = parseInt(parmPDFDate.substr(12, 2), 10);
    var seconds = parseInt(parmPDFDate.substr(14, 2), 10);
    // var timeZoneHour = parseInt(parmPDFDate.substr(16, 2), 10);
    // var timeZoneMinutes = parseInt(parmPDFDate.substr(20, 2), 10);

    var resultingDate = new Date(year, month, date, hour, minutes, seconds, 0);
    return resultingDate;
  });

  var setCreationDate = (API.__private__.setCreationDate = function(date) {
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
  });

  var getCreationDate = (API.__private__.getCreationDate = function(type) {
    var result = creationDate;
    if (type === "jsDate") {
      result = convertPDFDateToDate(creationDate);
    }
    return result;
  });

  /**
   * @name setCreationDate
   * @memberof jsPDF#
   * @function
   * @instance
   * @param {Object} date
   * @returns {jsPDF}
   */
  API.setCreationDate = function(date) {
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
  API.getCreationDate = function(type) {
    return getCreationDate(type);
  };

  var padd2 = (API.__private__.padd2 = function(number) {
    return ("0" + parseInt(number)).slice(-2);
  });

  var objectNumber = 0; // 'n' Current object number
  var offsets = []; // List of offsets. Activated and reset by buildDocument(). Pupulated by various calls buildDocument makes.
  var content = [];
  var contentLength = 0;
  var additionalObjects = [];

  var pages = [];
  var currentPage;
  var hasCustomDestination = false;
  var outputDestination = content;

  var resetDocument = function() {
    //reset fields relevant for objectNumber generation and xref.
    objectNumber = 0;
    contentLength = 0;
    content = [];
    offsets = [];
    additionalObjects = [];

    rootDictionaryObjId = newObjectDeferred();
    resourceDictionaryObjId = newObjectDeferred();
  };

  var setOutputDestination = function(destination) {
    if (!hasCustomDestination) {
      outputDestination = destination;
    }
  };

  var out = (API.__private__.out = function(string) {
    string = string.toString();
    contentLength += string.length + 1;
    outputDestination.push(string);

    return outputDestination;
  });

  var write = (API.__private__.write = function(value) {
    return out(
      arguments.length === 1
        ? value.toString()
        : Array.prototype.join.call(arguments, " ")
    );
  });

  var getArrayBuffer = (API.__private__.getArrayBuffer = function(data) {
    var len = data.length,
      ab = new ArrayBuffer(len),
      u8 = new Uint8Array(ab);

    while (len--) u8[len] = data.charCodeAt(len);
    return ab;
  });

  var pageMode; // default: 'UseOutlines';

  API.__private__.getPageMode = function() {
    return pageMode;
  };

  var layoutMode; // default: 'continuous';

  API.__private__.getLayoutMode = function() {
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
  var matrixMult = (API.matrixMult = function(m1, m2) {
    return m2.multiply(m1);
  });

  var newObject = (API.__private__.newObject = function() {
    var oid = newObjectDeferred();
    newObjectDeferredBegin(oid, true);
    return oid;
  });

  // Does not output the object.  The caller must call newObjectDeferredBegin(oid) before outputing any data
  var newObjectDeferred = (API.__private__.newObjectDeferred = function() {
    objectNumber++;
    offsets[objectNumber] = function() {
      return contentLength;
    };
    return objectNumber;
  });

  var newObjectDeferredBegin = function(oid, doOutput) {
    doOutput = typeof doOutput === "boolean" ? doOutput : false;
    offsets[oid] = contentLength;
    if (doOutput) {
      out(oid + " 0 obj");
    }
    return oid;
  };
  // Does not output the object until after the pages have been output.
  // Returns an object containing the objectId and content.
  // All pages have been added so the object ID can be estimated to start right after.
  // This does not modify the current objectNumber;  It must be updated after the newObjects are output.
  var newAdditionalObject = (API.__private__.newAdditionalObject = function() {
    var objId = newObjectDeferred();
    var obj = {
      objId: objId,
      content: ""
    };
    additionalObjects.push(obj);
    return obj;
  });

  var rootDictionaryObjId = newObjectDeferred();
  var resourceDictionaryObjId = newObjectDeferred();

  var getFilters = (API.__private__.getFilters = function() {
    return filters;
  });

  var putStream = (API.__private__.putStream = function(options) {
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
      processedData = { data: data, reverseChain: [] };
    }
    var filterAsString =
      processedData.reverseChain +
      (Array.isArray(alreadyAppliedFilters)
        ? alreadyAppliedFilters.join(" ")
        : alreadyAppliedFilters.toString());

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

            for (
              var i = 0;
              i < processedData.reverseChain.split("/").length - 1;
              i += 1
            ) {
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
  });

  var putPage = (API.__private__.putPage = function(page) {
    var pageNumber = page.number;
    var data = page.data;
    var pageObjectNumber = page.objId;
    var pageContentsObjId = page.contentsObjId;

    newObjectDeferredBegin(pageObjectNumber, true);
    out("<</Type /Page");
    out("/Parent " + page.rootDictionaryObjId + " 0 R");
    out("/Resources " + page.resourceDictionaryObjId + " 0 R");
    out(
      "/MediaBox [" +
        parseFloat(hpf(page.mediaBox.bottomLeftX)) +
        " " +
        parseFloat(hpf(page.mediaBox.bottomLeftY)) +
        " " +
        hpf(page.mediaBox.topRightX) +
        " " +
        hpf(page.mediaBox.topRightY) +
        "]"
    );
    if (page.cropBox !== null) {
      out(
        "/CropBox [" +
          hpf(page.cropBox.bottomLeftX) +
          " " +
          hpf(page.cropBox.bottomLeftY) +
          " " +
          hpf(page.cropBox.topRightX) +
          " " +
          hpf(page.cropBox.topRightY) +
          "]"
      );
    }

    if (page.bleedBox !== null) {
      out(
        "/BleedBox [" +
          hpf(page.bleedBox.bottomLeftX) +
          " " +
          hpf(page.bleedBox.bottomLeftY) +
          " " +
          hpf(page.bleedBox.topRightX) +
          " " +
          hpf(page.bleedBox.topRightY) +
          "]"
      );
    }

    if (page.trimBox !== null) {
      out(
        "/TrimBox [" +
          hpf(page.trimBox.bottomLeftX) +
          " " +
          hpf(page.trimBox.bottomLeftY) +
          " " +
          hpf(page.trimBox.topRightX) +
          " " +
          hpf(page.trimBox.topRightY) +
          "]"
      );
    }

    if (page.artBox !== null) {
      out(
        "/ArtBox [" +
          hpf(page.artBox.bottomLeftX) +
          " " +
          hpf(page.artBox.bottomLeftY) +
          " " +
          hpf(page.artBox.topRightX) +
          " " +
          hpf(page.artBox.topRightY) +
          "]"
      );
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
    out("endobj");
    // Page content
    var pageContent = data.join("\n");

    if (apiMode === ApiMode.ADVANCED) {
      // if the user forgot to switch back to COMPAT mode, we must balance the graphics stack again
      pageContent += "\nQ";
    }

    newObjectDeferredBegin(pageContentsObjId, true);
    putStream({
      data: pageContent,
      filters: getFilters(),
      objectId: pageContentsObjId
    });
    out("endobj");
    return pageObjectNumber;
  });

  var putPages = (API.__private__.putPages = function() {
    var n,
      i,
      pageObjectNumbers = [];

    for (n = 1; n <= page; n++) {
      pagesContext[n].objId = newObjectDeferred();
      pagesContext[n].contentsObjId = newObjectDeferred();
    }

    for (n = 1; n <= page; n++) {
      pageObjectNumbers.push(
        putPage({
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
        })
      );
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
  });

  var putXobjectDict = function() {
    out("/XObject <<");
    for (var xObjectKey in renderTargets) {
      if (
        renderTargets.hasOwnProperty(xObjectKey) &&
        renderTargets[xObjectKey].objectNumber >= 0
      ) {
        out(
          "/" +
            xObjectKey +
            " " +
            renderTargets[xObjectKey].objectNumber +
            " 0 R"
        );
      }
    }

    // Loop through images, or other data objects
    events.publish("putXobjectDict");
    out(">>");
  };

  var putResourceDictionary = function(objectIds) {
    newObjectDeferredBegin(objectIds.resourcesOid, true);
    out("<<");
    out("/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]");
    putXobjectDict();
    out(">>");
    out("endobj");
  };

  var putResources = function() {
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
        var m =
          "Error in function " +
          stack.split("\n")[0].split("<")[0] +
          ": " +
          e.message;
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

  var to8bitStream = function(text, flags) {
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

    var i,
      l,
      sourceEncoding,
      encodingBlock,
      outputEncoding,
      newtext,
      isUnicode,
      ch,
      bch;

    flags = flags || {};
    sourceEncoding = flags.sourceEncoding || "Unicode";
    outputEncoding = flags.outputEncoding;

    // This 'encoding' section relies on font metrics format
    // attached to font objects by, among others,
    // "Willow Systems' standard_font_metrics plugin"
    // see jspdf.plugin.standard_font_metrics.js for format
    // of the font.metadata.encoding Object.
    // It should be something like
    //   .encoding = {'codePages':['WinANSI....'], 'WinANSI...':{code:code, ...}}
    //   .widths = {0:width, code:width, ..., 'fof':divisor}
    //   .kerning = {code:{previous_char_code:shift, ..., 'fof':-divisor},...}
    if (
      (flags.autoencode || outputEncoding) &&
      fonts[activeFontKey].metadata &&
      fonts[activeFontKey].metadata[sourceEncoding] &&
      fonts[activeFontKey].metadata[sourceEncoding].encoding
    ) {
      encodingBlock = fonts[activeFontKey].metadata[sourceEncoding].encoding;

      // each font has default encoding. Some have it clearly defined.
      if (!outputEncoding && fonts[activeFontKey].encoding) {
        outputEncoding = fonts[activeFontKey].encoding;
      }

      // Hmmm, the above did not work? Let's try again, in different place.
      if (!outputEncoding && encodingBlock.codePages) {
        outputEncoding = encodingBlock.codePages[0]; // let's say, first one is the default
      }

      if (typeof outputEncoding === "string") {
        outputEncoding = encodingBlock[outputEncoding];
      }
      // we want output encoding to be a JS Object, where
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
          }

          // since we are looping over chars anyway, might as well
          // check for residual unicodeness
          if (newtext[i].charCodeAt(0) >> 8) {
            /* more than 255 */
            isUnicode = true;
          }
        }
        text = newtext.join("");
      }
    }

    i = text.length;
    // isUnicode may be set to false above. Hence the triple-equal to undefined
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
        throw new Error(
          "Character at position " +
            i +
            " of string '" +
            text +
            "' exceeds 16bits. Cannot be encoded into UCS-2 BE"
        );
      }
      newtext.push(bch);
      newtext.push(ch - (bch << 8));
    }
    return String.fromCharCode.apply(undefined, newtext);
  };

  var pdfEscape = (API.__private__.pdfEscape = API.pdfEscape = function(
    text,
    flags
  ) {
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
    return to8bitStream(text, flags)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  });

  var beginPage = (API.__private__.beginPage = function(format) {
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
  });

  var _addPage = function(parmFormat) {
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
      console.warn(
        "A page in a PDF can not be wider or taller than 14400 userUnit. jsPDF limits the width/height to 14400"
      );
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

  var _setPage = function(n) {
    if (n > 0 && n <= page) {
      currentPage = n;
    }
  };

  var getNumberOfPages = (API.__private__.getNumberOfPages = API.getNumberOfPages = function() {
    return pages.length - 1;
  });

  var putInfo = (API.__private__.putInfo = function() {
    out("<<");
    out("/Producer (" + pdfEscape("jsPDF " + jsPDF.version) + ")");
    for (var key in documentProperties) {
      if (documentProperties.hasOwnProperty(key) && documentProperties[key]) {
        out(
          "/" +
            key.substr(0, 1).toUpperCase() +
            key.substr(1) +
            " (" +
            pdfEscape(documentProperties[key]) +
            ")"
        );
      }
    }
    out("/CreationDate (" + pdfEscape(creationDate) + ")");
    out(">>");
    out("endobj");
  });

  var putCatalog = (API.__private__.putCatalog = function(options) {
    options = options || {};
    var tmpRootDictionaryObjId =
      options.rootDictionaryObjId || rootDictionaryObjId;
    newObject();
    out("<<");
    out("/Type /Catalog");
    out("/Pages " + tmpRootDictionaryObjId + " 0 R");
    // PDF13ref Section 7.2.1
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
    if (pageMode) {
      /**
       * A name object specifying how the document should be displayed when opened:
       * UseNone      : Neither document outline nor thumbnail images visible -- DEFAULT
       * UseOutlines  : Document outline visible
       * UseThumbs    : Thumbnail images visible
       * FullScreen   : Full-screen mode, with no menu bar, window controls, or any other window visible
       */
      out("/PageMode /" + pageMode);
    }
    events.publish("putCatalog");
    out(">>");
    out("endobj");
  });

  var putTrailer = (API.__private__.putTrailer = function() {
    out("trailer");
    out("<<");
    out("/Size " + (objectNumber + 1));
    // Root and Info must be the last and second last objects written respectively
    out("/Root " + objectNumber + " 0 R");
    out("/Info " + (objectNumber - 1) + " 0 R");
    out("/ID [ <" + fileId + "> <" + fileId + "> ]");
    out(">>");
  });

  var putHeader = (API.__private__.putHeader = function() {
    out("%PDF-" + pdfVersion);
    out("%\xBA\xDF\xAC\xE0");
  });

  var putXRef = (API.__private__.putXRef = function() {
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
  });

  var buildDocument = (API.__private__.buildDocument = function() {
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
  });

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
  var output = (API.output = API.__private__.output = SAFE(function output(
    type,
    options
  ) {
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
        return (
          "data:application/pdf;filename=" +
          options.filename +
          ";base64," +
          dataURI
        );
      default:
        return null;
    }
  }));

  /**
   * Used to see if a supplied hotfix was requested when the pdf instance was created.
   * @param {string} hotfixName - The name of the hotfix to check.
   * @returns {boolean}
   */
  var hasHotfix = function(hotfixName) {
    return (
      Array.isArray(hotfixes) === true && hotfixes.indexOf(hotfixName) > -1
    );
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
  API.addPage = function() {
    _addPage.apply(this, arguments);
    return this;
  };

  var isValidStyle = (API.__private__.isValidStyle = function(style) {
    var validStyleVariants = [
      undefined,
      null,
      "S",
      "D",
      "F",
      "DF",
      "FD",
      "f",
      "f*",
      "B",
      "B*",
      "n"
    ];
    var result = false;
    if (validStyleVariants.indexOf(style) !== -1) {
      result = true;
    }
    return result;
  });

  /**
   * Close the current path. The PDF "h" operator.
   * @name close
   * @function
   * @instance
   * @returns {jsPDF}
   * @memberof jsPDF#
   */
  var close = (API.close = function() {
    out("h");
    return this;
  });

  var getHorizontalCoordinate = (API.__private__.getHorizontalCoordinate = function(
    value
  ) {
    return scale(value);
  });

  var getVerticalCoordinate = (API.__private__.getVerticalCoordinate = function(
    value
  ) {
    if (apiMode === ApiMode.ADVANCED) {
      return value;
    } else {
      var pageHeight =
        pagesContext[currentPage].mediaBox.topRightY -
        pagesContext[currentPage].mediaBox.bottomLeftY;
      return pageHeight - scale(value);
    }
  });

  var getHorizontalCoordinateString = (API.__private__.getHorizontalCoordinateString = API.getHorizontalCoordinateString = function(
    value
  ) {
    return hpf(getHorizontalCoordinate(value));
  });

  var getVerticalCoordinateString = (API.__private__.getVerticalCoordinateString = API.getVerticalCoordinateString = function(
    value
  ) {
    return hpf(getVerticalCoordinate(value));
  });

  // applying plugins (more methods) ON TOP of built-in API.
  // this is intentional as we allow plugins to override
  // built-ins
  for (var plugin in jsPDF.API) {
    if (jsPDF.API.hasOwnProperty(plugin)) {
      if (plugin === "events" && jsPDF.API.events.length) {
        (function(events, newEvents) {
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
            events.subscribe.apply(
              events,
              [eventname].concat(
                typeof handler_and_args === "function"
                  ? [handler_and_args]
                  : handler_and_args
              )
            );
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
  _addPage(format, orientation);

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
jsPDF.version = "0.0.0";

export { jsPDF };
export default jsPDF;
