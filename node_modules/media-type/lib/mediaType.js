/**
 * media-type
 * @author Lovell Fuller
 *
 * This code is distributed under the Apache License Version 2.0, the terms of
 * which may be found at http://www.apache.org/licenses/LICENSE-2.0.html
 */

var MediaType = function() {
  this.type = null;
  this._setSubtypeAndSuffix(null);
  this.parameters = {};
};

MediaType.prototype.isValid = function() {
  return this.type !== null && this.subtype !== null && this.subtype !== "example";
};

MediaType.prototype._setSubtypeAndSuffix = function(subtype) {
  this.subtype = subtype;
  this.subtypeFacets = [];
  this.suffix = null;
  if (subtype) {
    if (subtype.indexOf("+") > -1 && subtype.substr(-1) !== "+") {
      var fixes = subtype.split("+", 2);
      this.subtype = fixes[0];
      this.subtypeFacets = fixes[0].split(".");
      this.suffix = fixes[1];
    } else {
      this.subtypeFacets = subtype.split(".");
    }
  }
};

MediaType.prototype.hasSuffix = function() {
  return !!this.suffix;
};

MediaType.prototype._firstSubtypeFacetEquals = function(str) {
  return this.subtypeFacets.length > 0 && this.subtypeFacets[0] === str;
};

MediaType.prototype.isVendor = function() {
  return this._firstSubtypeFacetEquals("vnd");
};

MediaType.prototype.isPersonal = function() {
  return this._firstSubtypeFacetEquals("prs");
};

MediaType.prototype.isExperimental = function() {
  return this._firstSubtypeFacetEquals("x") || this.subtype.substring(0, 2).toLowerCase() === "x-";
};

MediaType.prototype.asString = function() {
  var str = "";
  if (this.isValid()) {
    str = str + this.type + "/" + this.subtype;
    if (this.hasSuffix()) {
      str = str + "+" + this.suffix;
    }
    var parameterKeys = Object.keys(this.parameters);
    if (parameterKeys.length > 0) {
      var parameters = [];
      var that = this;
      parameterKeys.sort(function(a, b) {
        return a.localeCompare(b);
      }).forEach(function(element) {
        parameters.push(element + "=" + wrapQuotes(that.parameters[element]));
      });
      str = str + ";" + parameters.join(";");
    }
  }
  return str;
};

var wrapQuotes = function(str) {
  return (str.indexOf(";") > -1) ? '"' + str + '"' : str;
};

var unwrapQuotes = function(str) {
  return (str.substr(0, 1) === '"' && str.substr(-1) === '"') ? str.substr(1, str.length - 2) : str;
};

var mediaTypeMatcher = /^(application|audio|font|image|message|model|multipart|text|video|\*)\/([a-zA-Z0-9!#$%^&\*_\-\+{}\|'.`~]{1,127})(;.*)?$/;

var parameterSplitter = /;(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/;

exports.fromString = function(str) {
  var mediaType = new MediaType();
  if (str) {
    var match = str.match(mediaTypeMatcher);
    if (match && !(match[1] === '*' && match[2] !== '*')) { 
      mediaType.type = match[1];
      mediaType._setSubtypeAndSuffix(match[2]);
      if (match[3]) {
        match[3].substr(1).split(parameterSplitter).forEach(function(parameter) {
          var keyAndValue = parameter.split('=', 2);
          if (keyAndValue.length === 2) {
            mediaType.parameters[keyAndValue[0].toLowerCase().trim()] = unwrapQuotes(keyAndValue[1].trim());
          }
        });
      }
    }
  }
  return mediaType;
};
