const _ = require('lodash');
const GemVersion = require('./gem-version');

const OPS = {
  '=': (v, r) => v.compare(r) === 0,
  '!=': (v, r) => v.compare(r) !== 0,
  '>': (v, r) => v.compare(r) > 0,
  '<': (v, r) => v.compare(r) < 0,
  '>=': (v, r) => v.compare(r) >= 0,
  '<=': (v, r) => v.compare(r) <= 0,
  '~>': (v, r) => v.compare(r) >= 0 && v.release().compare(r.bump()) < 0,
};

const quoted  = Object.keys(OPS).map(k => _.escapeRegExp(k)).join('|');
const PATTERN_RAW = `\\s*(${quoted})?\\s*(${GemVersion.VERSION_PATTERN})\\s*`;
// --
// A regular expression that matches a requirement
const PATTERN = new RegExp(`^${PATTERN_RAW}$`);

// --
// The default requirement matches any version
const DefaultRequirement = [">=", new GemVersion(0)];

module.exports = class GemRequirement {
  // --
  // Factory method to create a GemRequirement object.  Input may be
  // a Version, a String, or nil.  Intended to simplify client code.
  //
  // If the input is "weird", the default version requirement is
  // returned.
  static create(input) {
    if (input instanceof GemRequirement) {
      return input;
    }
    return new GemRequirement(input);
  }

  // --
  // A default "version requirement" can surely _only_ be '>= 0'.
  static default() {
    return new GemRequirement('>= 0');
  }


  // --
  // Parse +obj+, returning an <tt>[op, version]</tt> pair. +obj+ can
  // be a String or a GemVersion.
  //
  // If +obj+ is a String, it can be either a full requirement
  // specification, like <tt>">= 1.2"</tt>, or a simple version number,
  // like <tt>"1.2"</tt>.
  //
  //     parse("> 1.0")                 // => [">", GemVersion.new("1.0")]
  //     parse("1.0")                   // => ["=", GemVersion.new("1.0")]
  //     parse(GemVersion.new("1.0")) # => ["=,  GemVersion.new("1.0")]

  static parse(obj) {
    if (obj instanceof GemVersion) {
      return ["=", obj];
    }

    const match = String(obj).match(PATTERN);
    if (!match) {
      throw new Error(`Illformed requirement [${obj}]`);
    }

    if (match[1] == ">=" && match[2] == "0") {
      return DefaultRequirement;
    } else {
      return [match[1] || "=", new GemVersion(match[2])];
    }
  }

  // --
  // Constructs a requirement from +requirements+. Requirements can be
  // Strings, GemVersions, or Arrays of those. +nil+ and duplicate
  // requirements are ignored. An empty set of +requirements+ is the
  // same as <tt>">= 0"</tt>.

  constructor(...requirements) {
    requirements = _(requirements).flatten().filter(Boolean).uniq().value();

    if (_.isEmpty(requirements)) {
      this.requirements = [DefaultRequirement];
    } else {
      this.requirements = requirements.map(GemRequirement.parse);
    }
  }

  // --
  // Concatenates the +new+ requirements onto this requirement.

  // def concat new
  //   new = new.flatten
  //   new.compact!
  //   new.uniq!
  //   new = new.map { |r| self.class.parse r }

  //   @requirements.concat new
  // end

  // --
  // Formats this requirement for use in a GemRequestSet::Lockfile.

  // def for_lockfile # :nodoc:
  //   return if [DefaultRequirement] == @requirements

  //   list = requirements.sort_by { |_, version|
  //     version
  //   }.map { |op, version|
  //     "${op} ${version}"
  //   }.uniq

  //   " (${list.join ', '})"
  // end

  // --
  // true if this gem has no requirements.

  // def none?
  //   if @requirements.size == 1
  //     @requirements[0] == DefaultRequirement
  //   else
  //     false
  //   end
  // end

  // --
  // true if the requirement is for only an exact version

  // def exact?
  //   return false unless @requirements.size == 1
  //   @requirements[0][0] == "="
  // end

  asList() {
    return this.requirements
      .map(([op, version]) => `${op} ${version}`)
      .sort();
  }

  // def hash # :nodoc:
  //   requirements.sort.hash
  // end

  // def marshal_dump # :nodoc:
  //   fix_syck_default_key_in_requirements

  //   [@requirements]
  // end

  // def marshal_load array # :nodoc:
  //   @requirements = array[0]

  //   fix_syck_default_key_in_requirements
  // end

  // def yaml_initialize(tag, vals) # :nodoc:
  //   vals.each do |ivar, val|
  //     instance_variable_set "@${ivar}", val
  //   end

  //   Gem.load_yaml
  //   fix_syck_default_key_in_requirements
  // end

  // def init_with coder # :nodoc:
  //   yaml_initialize coder.tag, coder.map
  // end

  // def to_yaml_properties # :nodoc:
  //   ["@requirements"]
  // end

  // def encode_with coder # :nodoc:
  //   coder.add 'requirements', @requirements
  // end

  // --
  // A requirement is a prerelease if any of the versions inside of it
  // are prereleases

  isPrerelease() {
    return this.requirements.some(r => r[1].isPrerelease());
  }

  // def pretty_print q # :nodoc:
  //   q.group 1, 'GemRequirement.new(', ')' do
  //     q.pp as_list
  //   end
  // end

  // --
  // True if +version+ satisfies this Requirement.

  // def satisfied_by? version
  //   raise ArgumentError, "Need a GemVersion: ${version.inspect}" unless
  //     GemVersion === version
  //   // #28965: syck has a bug with unquoted '=' YAML.loading as YAML::DefaultKey
  // requirements.all? { |op, rv| (OPS[op] || OPS["="]).call version, rv }
  // end

  satisfiedBy(version) {
    if (!version instanceof GemVersion) {
      throw new Error(`Need a GemVersion: ${version}`);
    }

    return this.requirements
      .every(([op, rv]) => {
        const fn = (OPS[op] || OPS['=']);
        return fn(version, rv);
      });
  }

  // alias :=== :satisfied_by?
  // alias :=~ :satisfied_by?

  // --
  // True if the requirement will not always match the latest version.

  // def specific?
  //   return true if @requirements.length > 1 # GIGO, > 1, > 2 is silly

  //   not %w[> >=].include? @requirements.first.first # grab the operator
  // end

  toString() {
    return this.asList().join(', ');
  }

  // def == other # :nodoc:
  //   GemRequirement === other and to_s == other.to_s
  // end

  // private

  // def fix_syck_default_key_in_requirements # :nodoc:
  //   Gem.load_yaml

  //   // Fixup the Syck DefaultKey bug
  //   @requirements.each do |r|
  //     if r[0].kind_of? GemSyckDefaultKey
  //       r[0] = "="
  //     end
  //   end
  // end
}
