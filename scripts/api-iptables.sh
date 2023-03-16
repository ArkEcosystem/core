#!/usr/bin/env bash
#mainnet_ports API_GLOBAL=4003 / devnet_ports API_GLOBAL=4003 / testnet_ports API_GLOBAL=4003
API_GLOBAL=4003
API_GLOBAL_RATE=300/second
API_GLOBAL_BURST=100

#Initialize api limiter
start_limit() {

table=$(sudo iptables -nL API_LIMIT 2> /dev/null)
myip=$(ip -o route get to 1.1.1.1 | sed -n 's/.*src \([0-9.]\+\).*/\1/p')

if [[ $table ]]; then
    sudo iptables -F API_LIMIT
    sudo iptables --append API_LIMIT --match limit --limit ${API_GLOBAL_RATE} --limit-burst ${API_GLOBAL_BURST} -j ACCEPT
    sudo iptables -A API_LIMIT -j REJECT
    echo "API Connection Limits exist, resetting rules..."
    echo "Done!"
else
    echo "Applying API Connection Limits..."
    sudo iptables -N API_LIMIT
    sudo iptables -I INPUT --match conntrack --ctstate NEW -p tcp -d $myip --dport ${API_GLOBAL} -j API_LIMIT
    sudo iptables --append API_LIMIT --match limit --limit ${API_GLOBAL_RATE} --limit-burst ${API_GLOBAL_BURST} -j ACCEPT
    sudo iptables -A API_LIMIT -j REJECT
    echo "Done!"
fi
}

#Stop limiter
stop_limit() {

table=$(sudo iptables -nL API_LIMIT 2> /dev/null)
myip=$(ip -o route get to 1.1.1.1 | sed -n 's/.*src \([0-9.]\+\).*/\1/p')

if [[ $table ]]; then
    sudo iptables -F API_LIMIT
    sudo iptables -D INPUT --match conntrack --ctstate NEW -p tcp -d $myip --dport ${API_GLOBAL} -j API_LIMIT > /dev/null 2>&1
    sudo iptables -X API_LIMIT
    echo "Removed API Connection Limits!"
fi

}

is_enabled() {

table=$(sudo iptables -nL API_LIMIT 2> /dev/null)
rate=$(sudo iptables -vxnL API_LIMIT 1 | awk '{print $12}')
burst=$(sudo iptables -vxnL API_LIMIT 1 | awk '{print $14}')

if [[ $table ]]; then
    echo "Status: Enabled"
    echo "Connection rate limit: ${rate}"
    echo "Connection burst limit: ${burst}"
else
    echo "Status: Disabled"
fi

}

case "$1" in
    start)   start_limit ;;
    stop)    stop_limit;;
    restart) stop_limit; start_limit ;;
    status)  is_enabled;;
    *) echo "usage: $0 start|stop|restart|status" >&2
       exit 1
       ;;
esac
