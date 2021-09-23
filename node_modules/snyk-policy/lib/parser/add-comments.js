module.exports = addComments;

var initialComment = '# Snyk (https://snyk.io) policy file, patches or ' +
                     'ignores known vulnerabilities.';
var inlineComments = {
  ignore: '# ignores vulnerabilities until expiry date; change duration by ' +
          'modifying expiry date',
  patch: '# patches apply the minimum changes required to fix a vulnerability',
};

function addComments(policyExport) {
  var lines = policyExport.split('\n');
  lines.unshift(initialComment);

  Object.keys(inlineComments).forEach(function (key) {
    var position = lines.indexOf(key + ':');
    if (position !== -1) {
      lines.splice(position, 0, inlineComments[key]);
    }
  });

  return lines.join('\n');
}
