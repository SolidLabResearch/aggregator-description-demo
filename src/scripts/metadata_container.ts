const program = require('commander');
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
    for (let quad of metadata.triples) {
        console.log(quad);
    }
}
export {};