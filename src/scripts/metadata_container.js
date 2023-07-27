"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require('commander');
const N3 = require('n3');
const writer = new N3.Writer();
const ld_fetch = require('ldfetch');
const fetch = new ld_fetch({});
program
    .version('0.0.1')
    .name('get-metadata-container');
program
    .command('get-metadata')
    .description('Get the metadata container in which the event exists.')
    .option('-r --resource <resource>', 'The resource of the event to get the metadata container from.')
    .parse(process.argv)
    .action((options) => {
    get_metadata_container(options.resource);
});
program.parse();
function get_metadata_container(resource) {
    return __awaiter(this, void 0, void 0, function* () {
        let ldp_container_meta = resource.split("/").slice(0, -1).join("/") + "/.meta";
        let metadata = yield fetch.get(ldp_container_meta);
        const store = new N3.Store();
        for (let quad of metadata.triples) {
            if (quad.predicate.value !== "http://www.w3.org/ns/ldp#contains") {
                store.addQuad(quad);
            }
        }
        const quads = store.getQuads(null, null, null, null);
        console.log(writer.quadsToString(quads));
    });
}
