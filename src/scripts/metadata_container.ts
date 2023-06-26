const program = require('commander');
const N3 = require('n3');
const writer = new N3.Writer()
const ld_fetch = require('ldfetch');
const fetch = new ld_fetch({});

program
    .version('0.0.1')
    .name('get-metadata-container')

program
    .command('get-metadata')
    .description('Get the metadata container in which the event exists.')
    .option(
        '-r --resource <resource>',
        'The resource of the event to get the metadata container from.'
    )
    .parse(process.argv)
    .action((options: any) => {
        get_metadata_container(options.resource);
    });

program.parse();

async function get_metadata_container(resource: string) {
    let ldp_container_meta = resource.split("/").slice(0, -1).join("/") + "/.meta";
    let metadata = await fetch.get(ldp_container_meta);
    const store = new N3.Store();
    for (let quad of metadata.triples) {
        if (quad.predicate.value !== "http://www.w3.org/ns/ldp#contains") {
            store.addQuad(quad);
        }
    }
    const quads = store.getQuads(null, null, null, null);
    console.log(writer.quadsToString(quads))    
}
export {};