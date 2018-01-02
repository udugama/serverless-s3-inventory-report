"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("@temando/errors");
const bluebird_1 = require("bluebird");
/**
 * poll aws api till the resource is ready.
 *
 * @param delayTime
 * @param timeout
 * @param waitFor
 */
function waitForStack({ waitFor, delayTime = 1000, timeout = 10000 }) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        while ((startTime + timeout) > Date.now()) {
            try {
                yield waitFor();
                return;
            }
            catch (err) {
                yield bluebird_1.delay(delayTime);
            }
        }
        throw new errors_1.TemandoError({
            status: '408',
            title: `AWS resource timeout of ${timeout} milliseconds exceeded.`,
            detail: `AWS resource timeout of ${timeout} milliseconds exceeded.`,
        });
    });
}
exports.waitForStack = waitForStack;
