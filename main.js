#!/usr/bin/env node
const fs = require("fs");

const { ArgumentParser } = require('./argparse.js');
const path = require("path");
const child_process = require("child_process");

const parser = new ArgumentParser({
    description: 'default args'
});


function get_args() {
    parser.add_argument('-xp', '--external-port', { help: 'external port to listen to, default to 80' });
    parser.add_argument('-lp', '--local-port', { help: 'local port to forward requests to, default to 8888' });
    parser.add_argument('-lh', '--local-host', { help: 'local host to forward requests to, default to localhost' });
    parser.add_argument('-sn', '--site-filename', { help: 'name of the site file to create (default to proxy-site-<timestamp>)' });
    parser.add_argument('-ar', '--apache-root', { help: 'root of apache2 installation (default to /etc/apache2)' });
    parser.add_argument('-ka', '--kill-all', { help: 'disable sites and remove site files (default to false), if true all other args are ignored' });
    parser.add_argument('-ci', '--command-interface', { help: 'creates an /exec endpoint accepting a get parameter "cmd" and executing it with child_process.execSync, a /stop endpoint to stop the server, and a / endpoint to return {"status": "ok"}' });

    return parser.parse_known_args()[0]
}

const args = get_args();

const external_port = args.external_port || 80
const local_host = args.local_host || 'localhost'
const local_port = args.local_port || 8888
const apache_root = args.apache_root || `/etc/apache2/`
const site_filename = args.site_filename || `proxy-site-${Date.now()}`
const kill_all = args.kill_all || false
const command_interface = args.command_interface || false

if (!fs.existsSync(path.join(apache_root, 'sites-available')))
    fs.mkdirSync(path.join(apache_root, 'sites-available'))

if (kill_all) {
    const files = fs.readdirSync(path.join(apache_root, 'sites-available'))
    for (const file of files) {
        if (!file.startsWith('proxy-site-')) continue
        child_process.execSync(`sudo a2dissite ${file.replace('.conf', '')}`)
        try {
            console.log(`deleting ${path.join(apache_root, `sites-available`, file)}`)
            fs.unlinkSync(path.join(apache_root, `sites-available`, file))
            console.log(`deleting ${path.join(apache_root, `sites-enabled`, file)}`)
            fs.unlinkSync(path.join(apache_root, `sites-enabled`, file))
        } catch (e) {
        }
    }
    return
}

const apache_config_template = `
    <VirtualHost *:#SP>
    Header set Access-Control-Allow-Origin "*"
    ProxyRequests Off
    <Proxy *>
         Order Deny,Allow
         Deny from all
         Allow from all
    </Proxy>
    ProxyPass / http://#PH:#PP/
    ProxyPassReverse / http://#PH:#PP/
</VirtualHost>`

const apache_config =
    apache_config_template
        .replace(/#PH/g, local_host)
        .replace(/#PP/g, local_port)
        .replace(`#SP`, external_port)

console.log(`writing ${path.join(apache_root, 'sites-available', `${site_filename}.conf`)}`);
fs.writeFileSync(path.join(apache_root, 'sites-available', `${site_filename}.conf`), apache_config)
if (!fs.existsSync(path.join(apache_root, 'ports.conf')))
    fs.writeFileSync(path.join(apache_root, 'ports.conf'), '')

console.log(`writing  ${path.join(apache_root, 'ports.conf')}`);
if (!new RegExp(`Listen\\s+${external_port}`, 'm').test(fs.readFileSync(path.join(apache_root, 'ports.conf'), 'utf-8')))
    fs.appendFileSync(path.join(apache_root, 'ports.conf'), `\nListen ${external_port}`)

console.log(`enabling site ${site_filename}`);
child_process.execSync(`sudo a2enmod proxy proxy_http headers proxy_balancer ssl`)
child_process.execSync(`sudo a2ensite ${site_filename}`)
console.log(`restarting apache2`);
child_process.execSync(`sudo service apache2 restart`)
child_process.execSync(`sudo systemctl restart apache2`)
console.log(`adding iptables rule`);
child_process.execSync(`sudo iptables -I INPUT -m state --state NEW -p tcp --dport ${external_port} -j ACCEPT`)

if (command_interface) {
    const server_file = `server.${Date.now()}.js`
    const local_server = fs.readFileSync(path.join(__dirname, 'local_server.js'), 'utf-8')
    fs.writeFileSync(server_file, local_server.replace('port = 3000', `port = ${local_port}`))
    // child_process.exec(`nohup node ${server_file}&`)


    const childProcess = child_process.spawn('node', [server_file], {
        detached: true,
        stdio: 'ignore',
    })

    childProcess.unref();



    console.log(`command interface running on port ${local_port}`);
}
