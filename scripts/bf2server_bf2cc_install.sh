#!/bin/bash
# adapted from https://github.com/mauirixxx/bf2d-bf2ccd/blob/master/install_bf2d_bf2ccd.sh
# and https://github.com/nihlen/bf2-docker/blob/master/assets/extract
# bf2server_bf2cc_install.sh
# bf2cc help:
# Optional command line switches:
  # -configdaemon        Goes through the reconfiguration section
  # -ranked              Runs the server in ranked mode
  # -showlog             Shows log to screen
  # -lockdemorec         Locks down demo recording (nobody can change)
  # -locknetsettings     Locks down BF2 network settings (nobody can change)
  # -nocoop              Prevents any user from being able to run a Coop (gpm_coop) server
  # -noquitprompts       No 'confirm' prompts when closing.
  # -autostart [profile] Immediatly starts the server.
  # -playerlimit         Nobody can exceed maximum player limit.
  # -skipportchecks      Skips open port checking for RCON and Daemon.
  # -dontpassthru       Dont pass + commands through to the executable.
  # -debugmode              Shows debug output for diagnostics.
  # -kill                Kills the daemon process started from this dir.
  # -skipdotnetcheck     Bypasses the .NET Framework check and associated Error dialogue boxes.
  # +config              BF2 serversettings.con (full path and file)
  # +mapList             BF2 maplist.con (full path and file)
  # +pbpath              BF2 redirect of the punkbuster path

#Timezone and format to 24h@UTC
update-locale LANGUAGE=en_GB.UTF-8 LANG=en_GB.UTF-8
timedatectl set-timezone UTC

LANIFACE=$(ip route get 1.1.1.1 | grep -Po '(?<=dev\s)\w+' | cut -f1 -d ' ')
LANIP=$(ip addr show "$LANIFACE" | grep "inet " | cut -d '/' -f1 | cut -d ' ' -f6)
echo Public IP: $LANIP

# args
while getopts ":hybmponlwjs:e:" opt; do
  case $opt in
     h)
       echo "Options:"
       echo "-y for non-interactive headless install with default options (no modded binary, mappack or freecam scripts)"
       echo "-b for binary mod by someone*"
       echo "-p install server with a password"
       echo "-o install with bf2hub"
       echo "-m install mappack by Breiker"
       echo "-n install nofreecam scripts by Breiker"
       echo "-w install webmin"
       echo "-j install nodejs & mm_webadmin"
       echo "-s smtp server to send user details with email with server details (-e required) (TODO)"
       echo "-e email address to send server details to (TODO)"
       echo "example usage:
       wget https://gist.githubusercontent.com/rkantos/308850b4b94a8c8bf5a3220811e93339/raw/bf2server_bf2cc_install.sh
cat <<"EOF" >/root/bf2.profile
export BF2SERVER_NAME="" #empty for a fortune teller
export RCON_PORT="4711"
export RCON_PASSWORD="super123"
export GAME_PORT="16567"
EOF
chmod a+x bf2server_bf2cc_install.sh
./bf2server_bf2cc_install.sh -y -o -n"
       exit;;
     y)
       HEADLESS=true
       ;;
     b)
       binmod=true
       ;;
     m)
       mappack=true
       ;;
     p)
       serverpw=true
       ;;
     o)
       bf2hub=true
       ;;
     n)
       nofreecam=true
       ;;
     l)
       lockerscript=true
       ;;
     w)
       webmin=true
       ;;
     j)
       nodejs=true
       ;;
     s)
       smtp=${OPTARG}
       ;;
     e)
       email=${OPTARG}
       ;;
     *)
       echo "invalid command: no parameter included with argument $OPTARG"
       ;;
  esac
done
echo headless $HEADLESS
echo binmod $binmod
echo mappack $mappack
echo bf2hub $bf2hub
echo nofreecam $nofreecam


while true; do
echo "For a successfull installation:"
echo "When the BF2cc script asks for a the following"
echo " Root Game Folder [/home/bf2]: "
echo "Please input [server] without brackets. Alternatively input [/home/bf2/server] again without brackets"
echo
echo
echo "Also make sure you keep track of the rcon password you use or you have to use bf2ccd.exe -configdaemon to reset it or reinstall bf2server with this script again."
echo
echo "DONE: Set path for saved demos and install nginx"
echo " - BF2 server demos should now be visible on the server after the first demo is recorded in domain.tld/demos"
echo "TODO: modern HTTP web server index https://larsjung.de/h5ai/"
echo "TODO: Name prompt for servername"


echo -n "Start BF2 server installation script, or n for skip : [y] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=y}"

else
    echo running headless
    choice=y
fi
echo

case $choice in
y)
break
;;
n)
echo "Using original default BF2 server binary"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

#Headless APT
export DEBIAN_FRONTEND=noninteractive

#32bit libs
dpkg --add-architecture i386


#packages
apt install netselect-apt -yq
netselect-apt -sno /etc/apt/sources.list
apt update
apt install sudo -yq

debian_version=$(lsb_release -cs)

# Check if the Debian version is 11 or 12
if [ "$debian_version" == "bullseye" ]; then
    echo "Debian 11 detected. Running 'apt upgrade'..."
    apt upgrade -yq
elif [ "$debian_version" == "bookworm" ]; then
    echo "Debian 12 detected. Skipping 'apt upgrade'."
    apt install python3-pip
fi
apt install libglib2.0-0:i386 gnupg software-properties-common fortune fortunes htop policycoreutils firewalld apt-transport-https libncurses5 expect nginx locales-all curl psmisc ca-certificates -yq
apt remove ufw -yq

#Webmin installation
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to install Webmin : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${webmin+x} ];then
      choice=n
   else
      echo "installing Webmin"
      choice=y
   fi
fi

case $choice in
y)

cd /root
FILEJCameron=jcameron-key.asc

if test -f "$FILEJCameron"; then
    echo "$FILEJCameron exists."
else
  wget https://download.webmin.com/jcameron-key.asc
	apt-key add jcameron-key.asc

  the_ppa="https://download.webmin.com/download/repository sarge contrib"
  if ! grep -q "^deb .*$the_ppa" /etc/apt/sources.list /etc/apt/sources.list.d/*; then
      touch /etc/apt/sources.list.d/webmin.list
    echo "deb https://download.webmin.com/download/repository sarge contrib" >> /etc/apt/sources.list.d/webmin.list
  fi

	apt update
  apt install webmin -yq
fi
echo "Installed Webmin"
break
;;
n)
echo "Webmin not installed"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

BF2SERVERUSER=bf2
PASS=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13 ; echo '')
sudo adduser --disabled-password --gecos "" --quiet bf2
echo "$BF2SERVERUSER:$PASS" | chpasswd
#adduser -m -p $(openssl passwd -1 $PASS) -s /bin/bash
#useradd -p $(openssl passwd -1 $PASS) $BF2SERVERUSER
#chsh -s /usr/bin/bash BF2
bf2dir=$(eval echo ~$BF2SERVERUSER)


# Add IP function to env
cat <<"EOF" >>/root/bf2.profile
export LANIFACE=$(ip route get 1.1.1.1 | grep -Po '(?<=dev\s)\w+' | cut -f1 -d ' ')
export BF2_SERVER_IP=$(ip addr show "$LANIFACE" | grep "inet " | cut -d '/' -f1 | cut -d ' ' -f6)
EOF
. /root/bf2.profile
# move env to BF2SERVERUSER
cat /root/bf2.profile >>/home/$BF2SERVERUSER/.profile



# Debian 10 Digitalocean iptables -> Nftables
apt install nftables -yq
sudo update-alternatives --set iptables /usr/sbin/iptables-nft
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-nft
sudo update-alternatives --set arptables /usr/sbin/arptables-nft
sudo update-alternatives --set ebtables /usr/sbin/ebtables-nft
sudo systemctl enable nftables.service


#https://github.com/cockpit-project/cockpit/pull/10648/commits/48e3c8e696383a8f30ddd2bf3025b204d6162ddf
sed -i '/IndividualCalls/ s/=no/=yes/' /etc/firewalld/firewalld.conf
sed -i '/FirewallBackend/ s/=iptables/=nftables/' /etc/firewalld/firewalld.conf


echo User $BF2SERVERUSER created with $PASS

#Find internet interface
INETIFACE=$(ip route get 1.1.1.1 | grep -Po '(?<=dev\s)\w+' | cut -f1 -d ' ')

# Webmin port--zone=public
sudo firewall-cmd --list-all --zone=public
sudo firewall-cmd --permanent --zone=public --change-interface=$INETIFACE
sudo firewall-cmd --add-service=ssh --permanent --zone=public
sudo firewall-cmd --permanent --service=webmin --add-port=22/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --new-service=webmin --permanent
sudo firewall-cmd --permanent --service=webmin --set-description=Webmin
sudo firewall-cmd --permanent --service=webmin --add-port=10000/tcp
sudo firewall-cmd --add-service=webmin --permanent --zone=public
#sudo firewall-cmd --remove-service=webmin --permanent --zone=public
sudo firewall-cmd --reload

cat <<"EOF" > bf2server.xml
<service>
  <short>bf2server</short>
  <description>Battlefield 2 server with BF2CC Daemon</description>
  <port protocol="udp" port="27900"/>
  <port protocol="udp" port="29900"/>
  <port protocol="udp" port="29901"/>
  <port protocol="tcp" port="29900"/>
  <port protocol="tcp" port="80"/>
  <port protocol="tcp" port="4711"/>
  <port protocol="tcp" port="4712"/>
  <port protocol="tcp" port="29901"/>
  <port protocol="udp" port="1500-4999"/>
  <port protocol="udp" port="1024-1124"/>
  <port protocol="tcp" port="1024-1124"/>
  <port protocol="udp" port="28910"/>
  <port protocol="udp" port="16567"/>
  <port protocol="udp" port="55123-55125"/>
</service>
EOF

SUPW=$1
# supw is your password for sudo access, which is only needed if the script is ran locally
# for example: "./install_bf2d_bf2ccd.sh StrongPassWord!"
echo $SUPW | sudo apt install wget unzip screen  -yq
#mkdir files && cd files
#wget https://raw.githubusercontent.com/mauirixxx/bf2d-bf2ccd/master/bf2server.xml
echo $SUPW | sudo mv bf2server.xml /etc/firewalld/services/
echo $SUPW | sudo restorecon /etc/firewalld/services/bf2server.xml
echo $SUPW | sudo chown root.root /etc/firewalld/services/bf2server.xml
echo $SUPW | sudo firewall-cmd --reload
echo $SUPW | sudo firewall-cmd --add-service=bf2server --permanent --zone=public
echo $SUPW | sudo firewall-cmd --reload

#Ran under the BF2 user

cd $bf2dir
sudo su -c 'whoami; pwd' $BF2SERVERUSER


# Alternative BF2 Server Binary download & install (Maybe BF2 Battlelog.co binary?)
#wget http://files.ausgamers.com/downloads/1608777376/bf2-linuxded-1.5.3153.0-installer.sh
# sudo su -c 'wget https://static.nihlen.net/bf2/server/bf2-linuxded-1.5.3153.0-installer.tgz' $BF2SERVERUSER
#wget http://download.bf2.us/servers/bf2.linux.server.tar.gz
#sudo su -c 'wget https://www.fullcontactwar.com/files/bf2.linux.server.tar.gz' $BF2SERVERUSER
#sudo su -c 'wget http://fizweb.elte.hu/battlefield/Battlefield-2/Server-Linux/' $BF2SERVERUSER


FILEBF2linuxded=bf2-linuxded-1.5.3153.0-installer.tgz
if test -f "$FILEBF2linuxded"; then
    echo "$FILEBF2linuxded exists."
else
	sudo su -c 'wget http://122166-bf2.drf.origin.gcdn.co/bf2-linuxded-1.5.3153.0-installer.tgz' $BF2SERVERUSER
	#sudo su -c 'wget http://fizweb.elte.hu/battlefield/Battlefield-2/Server-Linux/bf2-linuxded-1.5.3153.0-installer.tgz' $BF2SERVERUSER
fi


sudo su -c 'tar -xvzf bf2-linuxded-1.5.3153.0-installer.tgz' $BF2SERVERUSER
sudo su -c 'chmod +x bf2-linuxded-1.5.3153.0-installer.sh' $BF2SERVERUSER
#Run bf2-linuxded-1.5.3153.0-installer.sh with expect
{
sudo su -c /usr/bin/expect $BF2SERVERUSER << EOF
set timeout -1
spawn "./bf2-linuxded-1.5.3153.0-installer.sh" --keep --target ./server/

expect {
        eof { send_user "\nunexpected eof in extraction\n"; exit 1 }
        "*ress return"
}

send "^c"

send_user "\nExtraction finished\n"
EOF
}

# set rotate_demo.cfg path
sudo su -c 'sed -i "/target_root/ s/= \/path\/to\/webroot\/demos/= \/var\/www/" ~'$BF2SERVERUSER'/server/rotate_demo.cfg' $BF2SERVERUSER


# Make Python3 the default for 'python' on Debian 12 and convert rotate_demo.py with lib2to3 to work with Python 3
if [ "$debian_version" == "bullseye" ]; then
    echo "Debian 11 detected. Running 'apt upgrade'..."
    apt upgrade -yq
elif [ "$debian_version" == "bookworm" ]; then
	sudo update-alternatives --install /usr/bin/python python /usr/bin/python3 0
	sudo su -c 'python -m lib2to3 -w ~'$BF2SERVERUSER'/server/adminutils/demo/rotate_demo.py' $BF2SERVERUSER
    echo "Debian 12 detected. Skipping 'apt upgrade'."
fi

# Fix rotate_demo.py to add bf2:www-data permissions for bf2 demo files
sed -i '/import shutil/ s/import shutil/import shutil\n\import pwd\n\import grp/' server/adminutils/demo/rotate_demo.py
sed -i "/ensure_exists(os.path.join(options\['target_root'], 'demos'))/ s/ensure_exists(os.path.join(options\['target_root'], 'demos'))/ensure_exists(os.path.join(options\['target_root'], 'demos'))\n	os.chown(target_demo_dir, pwd.getpwnam('bf2').pw_uid, grp.getgrnam('www-data').gr_gid)/" server/adminutils/demo/rotate_demo.py
sed -i "/timestamped.append((os.stat(ppath).st_mtime, ppath))/ s/timestamped.append((os.stat(ppath).st_mtime, ppath))/timestamped.append((os.stat(ppath).st_mtime, ppath))\n			os.chown(ppath, pwd.getpwnam('bf2').pw_uid, grp.getgrnam('www-data').gr_gid)\n\
			os.chmod(ppath, int('775', base=8))/" server/adminutils/demo/rotate_demo.py

# add Nginx vhost (doesn't check for an existing one)
if grep -FR "location /demos" /etc/nginx/sites-available/default;
then
	echo Nginx "location /demos" vhost exists
else
	sed -i '/server_name _;/ s/server_name _;/\
	server_name _;\
	\
	location \/demos {\
        root \/var\/www;\
        index index.html;\
        autoindex on;\
        autoindex_exact_size off;\
        }/' /etc/nginx/sites-available/default
fi
service nginx restart

#Make correct permissions for bf2 user for /var/www
usermod -a -G www-data bf2
#Make sure /var/www permissions are correct
chown www-data:www-data /var/www
chmod 775 /var/www


#BF2Hub installation
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to install the BF2Hub support (BF2 server will be listed on BF2Hub) : [y] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=y}"
else
   echo running headless
   if [ -z ${bf2hub+x} ];then
      choice=n
   else
      echo "installing BF2Hub support"
      choice=y
   fi
fi

case $choice in
y)
FILEBF2Hub=BF2Hub-Unranked-Linux-R3.tar.gz
cd $bf2dir
sudo su -c 'wget https://www.bf2hub.com/downloads/BF2Hub-Unranked-Linux-R3.tar.gz' $BF2SERVERUSER
chown -R $BF2SERVERUSER:$BF2SERVERUSER $bf2dir
sudo su -c 'tar -xvzf BF2Hub-Unranked-Linux-R3.tar.gz --directory server' $BF2SERVERUSER
sudo su -c 'cp -a ~'$BF2SERVERUSER'/server/start.sh ~'$BF2SERVERUSER'/server/backup_`date +%Y-%m-%d_%H-%M-%S`_start.sh' $BF2SERVERUSER
sudo su -c 'chmod +x ~'$BF2SERVERUSER'/server/bin/ia-32/libbf2hub.so ~'$BF2SERVERUSER'/server/bin/amd-64/libbf2hub.so' $BF2SERVERUSER
sudo su -c 'cat ~'$BF2SERVERUSER'/server/start_bf2hub.sh > ~'$BF2SERVERUSER'/server/start.sh' $BF2SERVERUSER
sudo su -c 'chmod u+x ~'$BF2SERVERUSER'/server/start.sh' $BF2SERVERUSER

sudo su -c "sed -i '/BINARY_DIR/ s@$(pwd)@$(pwd)/server@' server/start.sh''" $BF2SERVERUSER

ISINTERNET="true"
echo "Installed BF2Hub support - server will be shown on BF2Hub serverlist"
break
;;
n)
ISINTERNET="false"
echo "BF2Hub support not installed - server will *not* be shown on BF2Hub"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done



# sudo su -c "sed -i '/BINARY_DIR/ s@$(pwd)@$(pwd)/server@' server/start.sh''" $BF2SERVERUSER
#sudo su -c 'mv server/ ~/bf2_server' $BF2SERVERUSER
#cd ~/bf2_server/
#cd server
sudo su -c 'rm ~'$BF2SERVERUSER'/server/pb' $BF2SERVERUSER
sudo su -c 'rm pb' $BF2SERVERUSER

sudo su -c 'chmod u+x server/bin/amd-64/bf2' $BF2SERVERUSER
#cd ~/files/
FILEBF2Mono=mono-1.1.12.1_0-installer.bin
if test -f "$FILEBF2Mono"; then
	echo "$FILEBF2Mono exists."
else
	sudo su -c 'wget http://download.mono-project.com/archive/1.1.12.1/linux-installer/0/mono-1.1.12.1_0-installer.bin' $BF2SERVERUSER
fi

sudo su -c 'chmod +x mono-1.1.12.1_0-installer.bin' $BF2SERVERUSER
sudo su -c 'yes | ./mono-1.1.12.1_0-installer.bin' $BF2SERVERUSER
sudo su -c 'mv y mono-1.1.12.1' $BF2SERVERUSER
# now just to verify it installed fine
sudo su -c '~'$BF2SERVERUSER'/mono-1.1.12.1/bin/mono -V' $BF2SERVERUSER
FILEBF2CCD=BF2CCD_1.4.2446.zip
if test -f "$FILEBF2CCD"; then
	echo "$FILEBF2CCD exists."
else
	sudo su -c 'wget https://www.fullcontactwar.com/files/BF2CCD_1.4.2446.zip' $BF2SERVERUSER
	#Modmanager v1.9 download
fi

#BF2 server name
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to set a server name : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   echo "Adding BF2 server name"
   choice=y
fi

case $choice in
y)

if test -z "$BF2SERVER_NAME"; then
	BF2SERVER_NAME=$(/usr/games/fortune | head -n 1 | sed 's/[^a-zA-Z, 0-9]//g' || fortune | head -n 1 | sed 's/[^a-zA-Z, 0-9]//g')
else
    echo "BF2 server name set to $BF2SERVER_NAME"
    echo "Setting BF2 server name to: " $BF2SERVER_NAME
fi
echo "BF2 server name set to:" echo $BF2SERVER_NAME
break
;;
n)
echo "A random BF2 server name added"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

#BF2 server password
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to set a server password : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${serverpw+x} ];then
      choice=n
   else
      echo "Adding BF2 server password"
      choice=y
   fi
fi

case $choice in
y)

if test -z "$BF2SERVERPASSWORD"; then
	BF2SERVERPASSWORD=$(date +"%Y")
    echo "Setting BF2 server password to: " + $BF2SERVERPASSWORD
else
    echo "BF2 server password set to $BF2SERVERPASSWORD"
fi
echo "BF2 server password set to:" + echo $BF2SERVERPASSWORD
break
;;
n)
echo "No BF2 server password added"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

#cd ~/bf2_server/
sudo su -c 'unzip -o ~'$BF2SERVERUSER'/BF2CCD_1.4.2446.zip -d ~'$BF2SERVERUSER'/server' $BF2SERVERUSER
#sudo su -c 'unzip -o ~'$BF2SERVERUSER'/server/modmanager-v1.4.zip -d server/' $BF2SERVERUSER
#sudo su -c 'unzip -o ~'$BF2SERVERUSER'/modmanager-v1.9.zip -d ~'$BF2SERVERUSER'/server/' $BF2SERVERUSER
FILEBF2Scripts=$bf2dir/modmanager-v1.9.zip
if test -f "$FILEBF2Scripts"; then
		echo "$FILEBF2Scripts exists."
else
		sudo su -c 'wget http://bf2.breiker.net/servers/files/modmanager-v1.9.zip' $BF2SERVERUSER
		sudo su -c 'unzip -o ~'$BF2SERVERUSER'/modmanager-v1.9.zip -d server/' $BF2SERVERUSER
fi
sudo su -c 'touch ~'$BF2SERVERUSER'/server/BF2_Playerbase_XX.profile' $BF2SERVERUSER
sudo su -c "cat <<EOF >~$BF2SERVERUSER/server/config.xml
<?xml version=\"1.0\" standalone=\"yes\"?>
<dsdDaemonInfo xmlns=\"http://bf2cc.com/dsdDaemonInfo.xsd\">
  <DaemonInfo>
    <DaemonInfoID>1</DaemonInfoID>
    <GameFolder>server/</GameFolder>
    <GameExec>start.sh</GameExec>
    <GameExecArgs />
    <AutoRestart>true</AutoRestart>
    <StartupProfile>BF2_Playerbase_XX</StartupProfile>
    <DaemonIP>0.0.0.0</DaemonIP>
    <DaemonPort>4712</DaemonPort>
    <ModName>bf2</ModName>
    <NetSettingsLocked>false</NetSettingsLocked>
    <DemoRecordingLocked>false</DemoRecordingLocked>
    <PlayerLimit>64</PlayerLimit>
    <DaemonArgsPassed>-showlog -autostart BF2_Playerbase_XX</DaemonArgsPassed>
  </DaemonInfo>
</dsdDaemonInfo>
EOF" $BF2SERVERUSER
sudo su -c "cat <<EOF >~$BF2SERVERUSER/server/BF2_Playerbase_XX.profile
<?xml version=\"1.0\" standalone=\"yes\"?>
<Profile>
  <ServerInfo>
    <ServerInfoID>1</ServerInfoID>
    <GameIP>0.0.0.0</GameIP>
    <GamePort>$GAME_PORT</GamePort>
    <GamespyPort>29900</GamespyPort>
    <RCONIP>0.0.0.0</RCONIP>
    <RCONPort>$RCON_PORT</RCONPort>
    <IsInternet>$ISINTERNET</IsInternet>
    <AllowNATNegotiate>false</AllowNATNegotiate>
    <PunkbusterEnabled>false</PunkbusterEnabled>
    <RCONPassword>$RCON_PASSWORD</RCONPassword>
  </ServerInfo>
  <GameInfo>
    <GameInfoID>1</GameInfoID>
    <ServerName>$BF2SERVER_NAME</ServerName>
    <ServerPassword>$BF2SERVERPASSWORD</ServerPassword>
    <AllowFreeCam>true</AllowFreeCam>
    <AllowExternalViews>true</AllowExternalViews>
    <AllowNoseCam>true</AllowNoseCam>
    <ShowHitIndicator>true</ShowHitIndicator>
    <DeathCamType>0</DeathCamType>
    <MaxPlayers>20</MaxPlayers>
    <PlayersToStart>1</PlayersToStart>
    <StartDelay>30</StartDelay>
    <EndDelay>15</EndDelay>
    <SpawnTime>15</SpawnTime>
    <ManDownTime>15</ManDownTime>
    <TicketRatio>200</TicketRatio>
    <RoundsPerMap>99</RoundsPerMap>
    <TimeLimit>20</TimeLimit>
    <ScoreLimit>0</ScoreLimit>
    <SoldierFF>100</SoldierFF>
    <VehicleFF>100</VehicleFF>
    <SoldierFFSplash>100</SoldierFFSplash>
    <VehicleFFSplash>100</VehicleFFSplash>
    <TKPunishEnabled>false</TKPunishEnabled>
    <TKsToKick>3</TKsToKick>
    <TKPunishByDefault>false</TKPunishByDefault>
    <VotingEnabled>false</VotingEnabled>
    <VoteTime>90</VoteTime>
    <MinPlayersVote>2</MinPlayersVote>
    <RestartMapDelay>30</RestartMapDelay>
    <AutoBalanceEnabled>false</AutoBalanceEnabled>
    <TeamRatioPercent>100</TeamRatioPercent>
    <AutoRecordDemo>true</AutoRecordDemo>
    <DemoIndexURL>http://$LANIP/demos/</DemoIndexURL>
    <DemoDownloadURL>http://$LANIP/demos/</DemoDownloadURL>
    <AutoDemoHook>adminutils/demo/rotate_demo.py</AutoDemoHook>
    <AdminScript>modmanager</AdminScript>
    <SponsorText />
    <SponsorLogoURL />
    <WelcomeMessage />
    <BandwidthChoke>0</BandwidthChoke>
    <EndOfRoundDelay>15</EndOfRoundDelay>
    <CommunityLogoURL />
    <NotEnoughPlayersRestartDelay>15</NotEnoughPlayersRestartDelay>
    <UseGlobalRank>false</UseGlobalRank>
    <UseGlobalUnlocks>false</UseGlobalUnlocks>
    <RadioSpamInterval>6</RadioSpamInterval>
    <RadioMaxSpamFlagCount>6</RadioMaxSpamFlagCount>
    <RadioBlockedDurationTime>30</RadioBlockedDurationTime>
    <DemoQuality>3</DemoQuality>
    <Ranked>false</Ranked>
    <ReservedSlots>0</ReservedSlots>
    <Mod>bf2</Mod>
    <MinesFF>0</MinesFF>
    <ShowTKPunishAnnouncements>2</ShowTKPunishAnnouncements>
    <CustomCommands />
    <CoopBotCount>16</CoopBotCount>
    <CoopBotRatio>50</CoopBotRatio>
    <CoopBotDifficulty>50</CoopBotDifficulty>
    <VotingEnableTeamOnly>false</VotingEnableTeamOnly>
    <InfantryOnly>true</InfantryOnly>
  </GameInfo>
  <RunningMaps>
    <RunningMapID>18</RunningMapID>
    <Order>17</Order>
    <MapName>Strike At Karkand</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>15</RunningMapID>
    <Order>14</Order>
    <MapName>Road To Jalalabad</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>8</RunningMapID>
    <Order>7</Order>
    <MapName>Mashtuur City</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>5</RunningMapID>
    <Order>4</Order>
    <MapName>Gulf Of Oman</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>16</RunningMapID>
    <Order>15</Order>
    <MapName>Sharqi Peninsula</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>3</RunningMapID>
    <Order>3</Order>
    <MapName>Fushe Pass</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>2</RunningMapID>
    <Order>2</Order>
    <MapName>Dragon Valley</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>1</RunningMapID>
    <Order>1</Order>
    <MapName>Daqing Oilfields</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>0</RunningMapID>
    <Order>0</Order>
    <MapName>Dalian Plant</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>7</RunningMapID>
    <Order>6</Order>
    <MapName>Kubra Dam</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>10</RunningMapID>
    <Order>9</Order>
    <MapName>Operation Blue Pearl</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>9</RunningMapID>
    <Order>8</Order>
    <MapName>Midnight Sun</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>6</RunningMapID>
    <Order>5</Order>
    <MapName>Highway Tampa</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>11</RunningMapID>
    <Order>10</Order>
    <MapName>Operation Clean Sweep</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>12</RunningMapID>
    <Order>11</Order>
    <MapName>Operation Harvest</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>13</RunningMapID>
    <Order>12</Order>
    <MapName>Operation Road Rage</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>14</RunningMapID>
    <Order>13</Order>
    <MapName>Operation Smoke Screen</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>17</RunningMapID>
    <Order>16</Order>
    <MapName>Songhua Stalemate</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>19</RunningMapID>
    <Order>18</Order>
    <MapName>Taraba Quarry</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>20</RunningMapID>
    <Order>19</Order>
    <MapName>Wake Island 2007</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>21</RunningMapID>
    <Order>20</Order>
    <MapName>Zatar Wetlands</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>4</RunningMapID>
    <Order>21</Order>
    <MapName>Great Wall</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <VOIPInfo>
    <VOIPInfoID>1</VOIPInfoID>
    <IsRemote>false</IsRemote>
    <ServerRemoteIP />
    <ServerPort>55125</ServerPort>
    <BFClientPort>55123</BFClientPort>
    <BFServerPort>55124</BFServerPort>
    <SharedPassword />
    <Quality>3</Quality>
    <IsEnabled>true</IsEnabled>
  </VOIPInfo>
  <ScoreInfo>
    <ScoreInfoID>1</ScoreInfoID>
    <Death>0</Death>
    <Kill>2</Kill>
    <AssistKill>1</AssistKill>
    <InDirectKill>1</InDirectKill>
    <Tk>-4</Tk>
    <Heal>1</Heal>
    <SoldierRevive>2</SoldierRevive>
    <Repair>1</Repair>
    <VehicleRevive>2</VehicleRevive>
    <Ammo>1</Ammo>
    <FlagCapture>5</FlagCapture>
    <FlagReturn>2</FlagReturn>
    <ControlPointCapture>4</ControlPointCapture>
    <Objective>5</Objective>
    <DriverPassenger>1</DriverPassenger>
    <TeamDamage>-1</TeamDamage>
    <TeamVehicleDamage>-2</TeamVehicleDamage>
    <HealScoreLimit>100</HealScoreLimit>
    <RepairScoreLimit>100</RepairScoreLimit>
    <AmmoScoreLimit>100</AmmoScoreLimit>
    <TeamDamageLimit>50</TeamDamageLimit>
    <TeamVehicleDamageLimit>25</TeamVehicleDamageLimit>
  </ScoreInfo>
</Profile>
EOF" $BF2SERVERUSER
sudo su -c "cat <<EOF >~$BF2SERVERUSER/server/BF2_Playerbase_8v8_vehicles.profile
<?xml version=\"1.0\" standalone=\"yes\"?>
<Profile>
  <ServerInfo>
    <ServerInfoID>1</ServerInfoID>
    <GameIP>0.0.0.0</GameIP>
    <GamePort>$GAME_PORT</GamePort>
    <GamespyPort>29900</GamespyPort>
    <RCONIP>0.0.0.0</RCONIP>
    <RCONPort>$RCON_PORT</RCONPort>
    <IsInternet>$ISINTERNET</IsInternet>
    <AllowNATNegotiate>false</AllowNATNegotiate>
    <PunkbusterEnabled>true</PunkbusterEnabled>
    <RCONPassword>$RCON_PASSWORD</RCONPassword>
  </ServerInfo>
  <GameInfo>
    <GameInfoID>1</GameInfoID>
    <ServerName>$BF2SERVER_NAME</ServerName>
    <ServerPassword>$BF2SERVERPASSWORD</ServerPassword>
    <AllowFreeCam>true</AllowFreeCam>
    <AllowExternalViews>true</AllowExternalViews>
    <AllowNoseCam>true</AllowNoseCam>
    <ShowHitIndicator>true</ShowHitIndicator>
    <DeathCamType>0</DeathCamType>
    <MaxPlayers>20</MaxPlayers>
    <PlayersToStart>1</PlayersToStart>
    <StartDelay>30</StartDelay>
    <EndDelay>15</EndDelay>
    <SpawnTime>15</SpawnTime>
    <ManDownTime>15</ManDownTime>
    <TicketRatio>200</TicketRatio>
    <RoundsPerMap>99</RoundsPerMap>
    <TimeLimit>20</TimeLimit>
    <ScoreLimit>0</ScoreLimit>
    <SoldierFF>100</SoldierFF>
    <VehicleFF>100</VehicleFF>
    <SoldierFFSplash>100</SoldierFFSplash>
    <VehicleFFSplash>100</VehicleFFSplash>
    <TKPunishEnabled>false</TKPunishEnabled>
    <TKsToKick>50</TKsToKick>
    <TKPunishByDefault>false</TKPunishByDefault>
    <VotingEnabled>false</VotingEnabled>
    <VoteTime>90</VoteTime>
    <MinPlayersVote>2</MinPlayersVote>
    <RestartMapDelay>30</RestartMapDelay>
    <AutoBalanceEnabled>false</AutoBalanceEnabled>
    <TeamRatioPercent>100</TeamRatioPercent>
    <AutoRecordDemo>true</AutoRecordDemo>
    <DemoIndexURL>http://$LANIP/demos/</DemoIndexURL>
    <DemoDownloadURL>http://$LANIP/demos/</DemoDownloadURL>
    <AutoDemoHook>adminutils/demo/rotate_demo.py</AutoDemoHook>
    <AdminScript>modmanager</AdminScript>
    <SponsorText />
    <SponsorLogoURL />
    <WelcomeMessage />
    <BandwidthChoke>0</BandwidthChoke>
    <EndOfRoundDelay>15</EndOfRoundDelay>
    <CommunityLogoURL />
    <NotEnoughPlayersRestartDelay>15</NotEnoughPlayersRestartDelay>
    <UseGlobalRank>false</UseGlobalRank>
    <UseGlobalUnlocks>false</UseGlobalUnlocks>
    <RadioSpamInterval>6</RadioSpamInterval>
    <RadioMaxSpamFlagCount>6</RadioMaxSpamFlagCount>
    <RadioBlockedDurationTime>30</RadioBlockedDurationTime>
    <DemoQuality>3</DemoQuality>
    <Ranked>false</Ranked>
    <ReservedSlots>0</ReservedSlots>
    <Mod>bf2</Mod>
    <MinesFF>1</MinesFF>
    <ShowTKPunishAnnouncements>2</ShowTKPunishAnnouncements>
    <CustomCommands />
    <CoopBotCount>16</CoopBotCount>
    <CoopBotRatio>50</CoopBotRatio>
    <CoopBotDifficulty>50</CoopBotDifficulty>
    <VotingEnableTeamOnly>false</VotingEnableTeamOnly>
    <InfantryOnly>false</InfantryOnly>
  </GameInfo>
  <RunningMaps>
    <RunningMapID>3</RunningMapID>
    <Order>0</Order>
    <MapName>Dalian Plant</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>4</RunningMapID>
    <Order>1</Order>
    <MapName>Daqing Oilfields</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>6</RunningMapID>
    <Order>2</Order>
    <MapName>Dragon Valley</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>8</RunningMapID>
    <Order>3</Order>
    <MapName>Fushe Pass</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>11</RunningMapID>
    <Order>4</Order>
    <MapName>Gulf Of Oman</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>12</RunningMapID>
    <Order>5</Order>
    <MapName>Highway Tampa</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>16</RunningMapID>
    <Order>6</Order>
    <MapName>Kubra Dam</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>17</RunningMapID>
    <Order>7</Order>
    <MapName>Mashtuur City</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>18</RunningMapID>
    <Order>8</Order>
    <MapName>Midnight Sun</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>19</RunningMapID>
    <Order>9</Order>
    <MapName>Operation Blue Pearl</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>20</RunningMapID>
    <Order>10</Order>
    <MapName>Operation Clean Sweep</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>21</RunningMapID>
    <Order>11</Order>
    <MapName>Operation Harvest</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>22</RunningMapID>
    <Order>12</Order>
    <MapName>Operation Road Rage</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>23</RunningMapID>
    <Order>13</Order>
    <MapName>Operation Smoke Screen</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>24</RunningMapID>
    <Order>14</Order>
    <MapName>Road To Jalalabad</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>25</RunningMapID>
    <Order>15</Order>
    <MapName>Sharqi Peninsula</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>27</RunningMapID>
    <Order>16</Order>
    <MapName>Songhua Stalemate</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>28</RunningMapID>
    <Order>17</Order>
    <MapName>Strike At Karkand</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>29</RunningMapID>
    <Order>18</Order>
    <MapName>Taraba Quarry</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>31</RunningMapID>
    <Order>19</Order>
    <MapName>Wake Island 2007</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>32</RunningMapID>
    <Order>20</Order>
    <MapName>Zatar Wetlands</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>10</RunningMapID>
    <Order>21</Order>
    <MapName>Great Wall</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>30</RunningMapID>
    <Order>22</Order>
    <MapName>Twl Inf East Side</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>15</RunningMapID>
    <Order>23</Order>
    <MapName>Karkandfu</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>14</RunningMapID>
    <Order>24</Order>
    <MapName>Jungle Stream</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>13</RunningMapID>
    <Order>25</Order>
    <MapName>Hue</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>9</RunningMapID>
    <Order>26</Order>
    <MapName>Goods Station</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>7</RunningMapID>
    <Order>27</Order>
    <MapName>Frostbite Night</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>5</RunningMapID>
    <Order>28</Order>
    <MapName>Dines City</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>2</RunningMapID>
    <Order>29</Order>
    <MapName>City Park</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>1</RunningMapID>
    <Order>31</Order>
    <MapName>City Of The Dead</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>0</RunningMapID>
    <Order>32</Order>
    <MapName>Basrah Streets</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <RunningMaps>
    <RunningMapID>26</RunningMapID>
    <Order>30</Order>
    <MapName>Sharqi West</MapName>
    <GameMode>gpm_cq</GameMode>
    <MaxPlayers>16</MaxPlayers>
  </RunningMaps>
  <VOIPInfo>
    <VOIPInfoID>1</VOIPInfoID>
    <IsRemote>false</IsRemote>
    <ServerRemoteIP />
    <ServerPort>55125</ServerPort>
    <BFClientPort>55123</BFClientPort>
    <BFServerPort>55124</BFServerPort>
    <SharedPassword />
    <Quality>3</Quality>
    <IsEnabled>true</IsEnabled>
  </VOIPInfo>
  <ScoreInfo>
    <ScoreInfoID>1</ScoreInfoID>
    <Death>0</Death>
    <Kill>2</Kill>
    <AssistKill>1</AssistKill>
    <InDirectKill>1</InDirectKill>
    <Tk>-4</Tk>
    <Heal>1</Heal>
    <SoldierRevive>2</SoldierRevive>
    <Repair>1</Repair>
    <VehicleRevive>2</VehicleRevive>
    <Ammo>1</Ammo>
    <FlagCapture>5</FlagCapture>
    <FlagReturn>2</FlagReturn>
    <ControlPointCapture>4</ControlPointCapture>
    <Objective>5</Objective>
    <DriverPassenger>1</DriverPassenger>
    <TeamDamage>-1</TeamDamage>
    <TeamVehicleDamage>-2</TeamVehicleDamage>
    <HealScoreLimit>100</HealScoreLimit>
    <RepairScoreLimit>100</RepairScoreLimit>
    <AmmoScoreLimit>100</AmmoScoreLimit>
    <TeamDamageLimit>50</TeamDamageLimit>
    <TeamVehicleDamageLimit>25</TeamVehicleDamageLimit>
  </ScoreInfo>
</Profile>
EOF" $BF2SERVERUSER

sudo su -c "cat <<EOF >~$BF2SERVERUSER/server/autoadmin.xml
<?xml version=\"1.0\" standalone=\"yes\"?>
<dsdAA xmlns=\"http://tempuri.org/dsdAA.xsd\">
  <AutoAdmin>
    <AutoAdminID>1</AutoAdminID>
    <HighPingEnabled>false</HighPingEnabled>
    <HighPingThreshold>350</HighPingThreshold>
    <HighPingWarnings>true</HighPingWarnings>
    <SmartBalanceEnabled>false</SmartBalanceEnabled>
    <SmartBalanceThreshold>2</SmartBalanceThreshold>
    <EORTeamSwap>true</EORTeamSwap>
    <IdleKickEnabled>false</IdleKickEnabled>
    <IdleKickMinutes>5</IdleKickMinutes>
    <LanguageFilterEnabled>true</LanguageFilterEnabled>
    <LanguageFilterWarns>1</LanguageFilterWarns>
    <LanguageFilterKicks>1</LanguageFilterKicks>
    <LanguageFilterWords>fuck,shit,cock,donkey cum</LanguageFilterWords>
    <AutoMessagesEnabled>false</AutoMessagesEnabled>
    <SmartBalanceClanTags>YourClanTag1,YourClanTag2</SmartBalanceClanTags>
    <UseAADelay>false</UseAADelay>
    <TKPunishEnabled>false</TKPunishEnabled>
    <TKsBeforeKick>0</TKsBeforeKick>
    <TKsBeforeBan>0</TKsBeforeBan>
    <NegativeScoreKickEnabled>false</NegativeScoreKickEnabled>
    <NegativeScoreKickThreshold>-10</NegativeScoreKickThreshold>
    <RandomizeTeams>false</RandomizeTeams>
  </AutoAdmin>
</dsdAA>
EOF" $BF2SERVERUSER

#Modified BF2-server binary
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to install the modified (enhanced) BF2 server binary, or n for skip : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${binmod+x} ];then
      choice=n
   else
      echo "installing modified binary"
      choice=y
   fi
fi

case $choice in
y)
FILEBF2ModdBin=bf2
if test -f "$FILEBF2ModdBin"; then
    echo "$FILEBF2ModdBin exists."
else
	cd $bf2dir
	sudo su -c 'wget https://cdn.discordapp.com/attachments/868527171302457384/868527308712075294/bf2' $BF2SERVERUSER
	FILEBF2ModBinOrig=server/bin/amd-64/bf2-original-bin
	if test -f "$FILEBF2ModBinOrig"; then
		echo "$FILEBF2ModBinOrig exists."
		break
	else
		sudo su -c 'cp server/bin/amd-64/bf2 server/bin/amd-64/bf2-original-bin' $BF2SERVERUSER
	fi
	sudo su -c 'cp bf2 server/bin/amd-64/' $BF2SERVERUSER
fi
echo "Installed Modified (enhanced) BF2 server binary"
break
;;
n)
echo "Using original default BF2 server binary"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

#BF2 Mappack by Breiker http://bf2.breiker.net/
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to install custom mappack by Breiker? - or n for skip : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${mappack+x} ];then
      choice=n
   else
      echo "istalling Mappack by Breiker"
      choice=y
   fi
fi

case $choice in
y)
	cd $bf2dir
	FILEBF2Mappack=bf2_playerbase_mappack_v0.2.zip
	if test -f "$FILEBF2Mappack"; then
		echo "$FILEBF2Mappack exists."
		sudo su -c 'unzip -o bf2_playerbase_mappack_v0.2.zip -d server/mods/bf2/levels/' $BF2SERVERUSER
	else
	sudo su -c 'wget http://bf2.breiker.net/servers/maps/bf2_playerbase_mappack_v0.2.zip' $BF2SERVERUSER
	sudo su -c 'unzip -o bf2_playerbase_mappack_v0.2.zip -d server/mods/bf2/levels/' $BF2SERVERUSER
fi
echo "Installed Mappack by Breiker"
break
;;
n)
echo "Only Vanilla Maps.."
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done



#BF2 Scripts by Breiker https://github.com/breiker/bf2_scripts (no freecam script)
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to install BF2 Scripts by Breiker (no freecam script)? - or n for skip : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${nofreecam+x} ];then
      choice=n
   else
      echo "installing Nofreecam script by Breiker"
      choice=y
   fi
fi

case $choice in
y)
        cd $bf2dir
        FILEBF2Scripts=$bf2dir/server/admin/modules/mm_stream_freecam.py
        if test -f "$FILEBF2Scripts"; then
                echo "$FILEBF2Scripts exists."
        else
			sudo su -c 'wget https://raw.githubusercontent.com/breiker/bf2_scripts/main/admin/modules/mm_stream_freecam.py -P server/admin/modules/' $BF2SERVERUSER
			#ModManager now installed after BF2CC sudo su -c 'wget http://bf2.breiker.net/servers/files/modmanager-v1.9.zip' $BF2SERVERUSER
			#sudo su -c 'unzip -o ~'$BF2SERVERUSER'/modmanager-v1.9.zip -d ~'$BF2SERVERUSER'/server/' $BF 2SERVERUSER
			sed -i '/# Modules/ s/# Modules/# Modules\nmodmanager.loadModule "mm_stream_freecam"/' $bf2dir/server/mods/bf2/settings/modmanager.con
fi
echo "Installed BF2 Scripts by Breiker (freecam script)"
break
;;
n)
echo "Freecam scripts not installed (default ModManager)"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

#BF2 server locking script to allow passwordless matches (mm_locker.py)
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to install BF2 server locker script (mm_locker.py)? - or n for skip : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${lockerscript+x} ];then
      choice=n
   else
      echo "installing locker script"
      choice=y
   fi
fi

case $choice in
y)
        cd $bf2dir
        FILEBF2Scripts=$bf2dir/server/admin/modules/mm_locker.py
        if test -f "$FILEBF2Scripts"; then
                echo "$FILEBF2Scripts exists."
        else
			sudo su -c 'wget https://raw.githubusercontent.com/rkantos/bf2-matchmaking/main/scripts/mm_locker.py -P server/admin/modules/' $BF2SERVERUSER
			#ModManager now installed after BF2CC sudo su -c 'wget http://bf2.breiker.net/servers/files/modmanager-v1.9.zip' $BF2SERVERUSER
			#sudo su -c 'unzip -o ~'$BF2SERVERUSER'/modmanager-v1.9.zip -d ~'$BF2SERVERUSER'/server/' $BF2SERVERUSER
			sed -i '/# Modules/ s/# Modules/# Modules\nmodmanager.loadModule "mm_locker"/' $bf2dir/server/mods/bf2/settings/modmanager.con
fi
echo "Installed BF2 server locker script (mm_locker.py)"
break
;;
n)
echo "Server locker script not installed"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

#BF2 Matchmaking nodejs callback Scripts by Artic https://github.com/espehel/bf2-matchmaking/tree/main/scripts
while true; do
echo "y to enter"
echo "n to skip"
echo

echo -n "Do you want to install BF2 Nodejs callback Scripts by Artic? - or n for skip : [n] "
if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${nodejs+x} ];then
      choice=n
   else
      echo "installing BF2 Nodejs callback Scripts"
      choice=y
   fi
fi

case $choice in
y)
        cd $bf2dir
        FILEBF2Scripts=$bf2dir/server/admin/modules/mm_webadmin.py
        if test -f "$FILEBF2Scripts"; then
                echo "$FILEBF2Scripts exists."
        else
		cat /root/bf2.profile >>/home/$BF2SERVERUSER/.profile
		cat /root/bf2.profile >>/home/$BF2SERVERUSER/.bashrc
cat <<"EOF" >>/etc/sudoers
bf2 ALL=(ALL) NOPASSWD: /usr/bin/firewall-cmd*
EOF
		#curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
		mkdir -p /etc/apt/keyrings
		curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

		NODE_MAJOR=18
		echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
		apt update
		apt install nodejs git xmlstarlet -yq
		FILEBF2Scripts=modmanager-v1.9.zip
        if test -f "$FILEBF2Scripts"; then
                echo "$FILEBF2Scripts exists."
		else
			#ModManager now installed after BF2CC sudo su -c 'wget http://bf2.breiker.net/servers/files/modmanager-v1.9.zip' $BF2SERVERUSER
			#sudo su -c 'unzip -o ~'$BF2SERVERUSER'/modmanager-v1.9.zip -d ~'$BF2SERVERUSER'/server/' $BF2SERVERUSER
			echo no modmanager install
		fi
		sudo su -c 'git clone https://github.com/espehel/bf2-matchmaking.git ~'$BF2SERVERUSER'/bf2-matchmaking' $BF2SERVERUSER
		sudo su -c 'yes | cp ~'$BF2SERVERUSER'/bf2-matchmaking/scripts/* ~'$BF2SERVERUSER'' $BF2SERVERUSER

		#wget https://raw.githubusercontent.com/nihlen/bf2-docker/master/images/bf2hub-pb-mm-webadmin/assets/build/bf2/admin/modules/mm_webadmin.py -P /home/bf2/server/admin/modules/
		sudo su -c 'yes | cp ~'$BF2SERVERUSER'/mm_webadmin.py -P ~'$BF2SERVERUSER'/server/admin/modules/' $BF2SERVERUSER
		sudo su -c "sed -i '/# Modules/ s/# Modules/# Modules\nmodmanager.loadModule "'"'"mm_webadmin"'"'"/' ~$BF2SERVERUSER/server/mods/bf2/settings/modmanager.con"

		# replace with GIT
		# sudo su -c 'rm restart-bf2.sh' $BF2SERVERUSER
		sudo su -c 'wget https://raw.githubusercontent.com/rkantos/bf2-matchmaking/main/scripts/restart-bf2.sh -O restart-bf2.sh' $BF2SERVERUSER
		sudo su -c 'chmod a+x ~'$BF2SERVERUSER'/restart-bf2.sh' $BF2SERVERUSER

		# nodeJS monster
		# replace with GIT
		# sudo su -c 'rm bf2wa-event-handler.js' $BF2SERVERUSER
		sudo su -c 'wget https://raw.githubusercontent.com/espehel/bf2-matchmaking/main/scripts/rkantos.js -O bf2wa-event-handler.js' $BF2SERVERUSER
		sudo su -c 'chmod a+x ~'$BF2SERVERUSER'/restart-bf2.sh' $BF2SERVERUSER

		# sudo su -c "sed -i '/const crypto/ s/const crypto = require('\''crypto'\'');/\/\//' ~$BF2SERVERUSER/http-bf2-server-exec.js"
		#sed -i '/# Modules/ s/# Modules/# Modules\nmodmanager.loadModule "mm_webadmin"/' /home/bf2/server/mods/bf2/settings/modmanager.con
		#sudo su -c 'cat ~'$BF2SERVERUSER'/http-bf2-server-exec.js >> ~'$BF2SERVERUSER'/bf2wa-event-handler.js'
		#sudo su -c 'head -n -6 ~'$BF2SERVERUSER'/bf2wa-event-handler.js > ~'$BF2SERVERUSER'/bf2wa-event-handler-head.js && cat ~'$BF2SERVERUSER'/bf2wa-event-handler-head.js > ~'$BF2SERVERUSER'/bf2wa-event-handler.js && rm ~'$BF2SERVERUSER'/bf2wa-event-handler-head.js'
		#NodeJS cron
		#(crontab -u $BF2SERVERUSER -l 2>/dev/null; echo "@reboot screen -AdmS nodejs bash -c "'"'"while ! ping -c 1 -W 1 1.1.1.1; do sleep 1; done && . ~$BF2SERVERUSER/.profile && env && node ~$BF2SERVERUSER/bf2wa-event-handler.js"'"'"") | sort - | uniq - | crontab -u $BF2SERVERUSER -
		(crontab -u $BF2SERVERUSER -l 2>/dev/null; echo "@reboot screen -AdmS nodejs bash -c 'while ! ping -c 1 -W 1 1.1.1.1; do sleep 1; done && . ~$BF2SERVERUSER/.profile && env && node ~$BF2SERVERUSER/bf2wa-event-handler.js'") | sort - | uniq - | crontab -u $BF2SERVERUSER -


fi
echo "Installed Nodejs callback Scripts by Artic"
break
;;
n)
echo "Nodejs callback Scripts not installed"
break
;;
*)
echo "That is not a valid choice, try a number from 0 to 10."
;;
esac
done

# Cron
# https://stackoverflow.com/questions/878600/how-to-create-a-cron-job-using-bash-automatically-without-the-interactive-editor
sudo su -c 'whoami; pwd' $BF2SERVERUSER
(crontab -u $BF2SERVERUSER -l 2>/dev/null; echo "@reboot screen -AdmS bf2server bash -c "'"'"~$BF2SERVERUSER/mono-1.1.12.1/bin/mono ~$BF2SERVERUSER/server/bf2ccd.exe -showlog -autostart BF2_Playerbase_XX"'"'"") | sort - | uniq - | crontab -u $BF2SERVERUSER -

#Reboot server at 0300 UTC and 1400UTC
(crontab -u root -l 2>/dev/null; echo "0 3 * * * shutdown -r") | sort - | uniq - | crontab -u root -
(crontab -u root -l 2>/dev/null; echo "0 14 * * * shutdown -r") | sort - | uniq - | crontab -u root -

sudo su -c 'screen -AdmS bf2server bash -c "'$bf2dir'/mono-1.1.12.1/bin/mono '$bf2dir'/server/bf2ccd.exe -showlog -autostart BF2_Playerbase_XX"' $BF2SERVERUSER


if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
	sudo su -c 'screen -x bf2server' $BF2SERVERUSER
else
   echo running headless
fi

if [ -z ${HEADLESS+x} ];then
    read choice
    choice="${choice:=n}"
else
   echo running headless
   if [ -z ${nodejs+x} ];then
      choice=n
   else
      sudo su -c 'screen -AdmS nodejs bash -c "while ! ping -c 1 -W 1 1.1.1.1; do sleep 1; done && . ~'$BF2SERVERUSER'/.profile && env && node ~'$BF2SERVERUSER'/bf2wa-event-handler.js"' bf2
   fi
fi



if [ -z ${HEADLESS+x} ];then
    break
else
    screen -x bf2server
	echo $LANIP
	echo $RCON_PORT
	echo $RCON_PASSWORD
	sleep 5; curl --location 'https://bf2-rcon.up.railway.app/servers' \
	--header 'Content-Type: application/json' \
	--data '{
    "ip": "'$LANIP'",
    "port": "'$GAME_PORT'",
    "rcon_port": "'$RCON_PORT'",
    "rcon_pw": "'$RCON_PASSWORD'"
	}'
fi

echo User $BF2SERVERUSER created with $PASS

# Cleanup
apt upgrade -yq
apt autoremove -yq
echo $bf2dir
rm $bf2dir/bf2-linuxded-1.5.3153.0-installer.sh