A simple tool to create a server and expose it to the internet using nodejs.

The script will create an apache virtual host that listens on a given port and forwards traffic received at that port to some local port. The script can also create a local server that listen on the local port with some useful endpoints (see `ci` argument).

NOTE (for those who are confused whther they can use this tool or not):
 - The machine to use to create the server must not have a firewall blocking traffic on the port you want to expose to the internet,
 - For cloud providers you probably need to add a rule in the firewall, unless you use a port that is used by default,
 - For computers at home (behind a router), you probably can't use the tool unless you configure the router (port forwarding...).

# Installation

    npm install -g exposeserver

# Requirements

    - Apache2

# Usage
You need to have super user privileges.

    sudo exposeserver [-h] [-xp SERVER_PORT] [-lp PROXY_PORT] [-lh LOCAL_HOST] [-sn SITE_FILENAME] [-ar APACHE_ROOT] [-ka KILL_ALL]
               [-ci COMMAND_INTERFACE]


    optional arguments:
    -h, --help            show this help message and exit
    -xp SERVER_PORT, --server-port SERVER_PORT
                            external port to listen to, default to 80
    -lp PROXY_PORT, --proxy-port PROXY_PORT
                            local port to forward requests to, default to 8888
    -lh LOCAL_HOST, --local-host LOCAL_HOST
                            local host to forward requests to, default to localhost
    -sn SITE_FILENAME, --site-filename SITE_FILENAME
                            name of the site file to create (default to proxy-site-<timestamp>)
    -ar APACHE_ROOT, --apache-root APACHE_ROOT
                            root of apache2 installation (default to /etc/apache2)
    -ka KILL_ALL, --kill-all KILL_ALL
                            disable sites and remove site files (default to false), if true all other args are ignored
    -ci COMMAND_INTERFACE, --command-interface COMMAND_INTERFACE
                            creates an /exec endpoint accepting a get parameter "cmd" and executing it with child_process.execSync, and
                            a /stop endpoint to stop the server

# Example
    
    npx makeserver -lp 8787

will create an apache virtual host at port 80 (default) and forward traffic from that port to local port 8787.