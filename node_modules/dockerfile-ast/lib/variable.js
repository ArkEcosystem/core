"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Variable {
    constructor(name, nameRange, range, modifier, modifierRange, substitutionParameter, substitutionRange, defined, buildVariable, stringValue) {
        this.name = name;
        this.nameRange = nameRange;
        this.range = range;
        this.modifier = modifier;
        this.modifierRange = modifierRange;
        this.substitutionParameter = substitutionParameter;
        this.substitutionRange = substitutionRange;
        this.defined = defined;
        this.buildVariable = buildVariable;
        this.stringValue = stringValue;
    }
    toString() {
        return this.stringValue;
    }
    getName() {
        return this.name;
    }
    getNameRange() {
        return this.nameRange;
    }
    /**
     * Returns the range of the entire variable. This includes the symbols for
     * the declaration of the variable such as the $, {, and } symbols.
     *
     * @return the range in the document that this variable encompasses in its
     *         entirety
     */
    getRange() {
        return this.range;
    }
    /**
     * Returns the modifier character that has been set for
     * specifying how this variable should be expanded and resolved.
     * If this variable is ${variable:+value} then the modifier
     * character is '+'. Will be the empty string if the variable is
     * declared as ${variable:}. Otherwise, will be null if this
     * variable will not use variable substitution at all (such as
     * ${variable} or $variable).
     *
     * @return this variable's modifier character, or the empty
     *         string if it does not have one, or null if this
     *         variable will not use variable substitution
     */
    getModifier() {
        return this.modifier;
    }
    getModifierRange() {
        return this.modifierRange;
    }
    /**
     * Returns the parameter that will be used for substitution if
     * this variable uses modifiers to define how its value should be
     * resolved. If this variable is ${variable:+value} then the
     * substitution value will be 'value'. Will be the empty string
     * if the variable is declared as ${variable:+} or some other
     * variant where the only thing that follows the modifier
     * character (excluding considerations of escape characters and
     * so on) is the variable's closing bracket. May be null if this
     * variable does not have a modifier character defined (such as
     * ${variable} or $variable).
     *
     * @return this variable's substitution parameter, or the empty
     *         string if it does not have one, or null if there is
     *         not one defined
     */
    getSubstitutionParameter() {
        return this.substitutionParameter;
    }
    getSubstitutionRange() {
        return this.substitutionRange;
    }
    /**
     * Returns whether this variable has been defined or not.
     *
     * @return true if this variable has been defined, false otherwise
     */
    isDefined() {
        return this.defined;
    }
    isBuildVariable() {
        return this.buildVariable === true;
    }
    isEnvironmentVariable() {
        return this.buildVariable === false;
    }
}
exports.Variable = Variable;
