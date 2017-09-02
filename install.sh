#/bin/bash
#

set -e

TOPDIR=`pwd`

RED="\033[31;1m"
GREEN="\033[32;1m"
RESET="\033[0m"

introduction()
{
	echo ""
	echo "###############   Ubuntu Enviromrnt Install    ###############"
	echo "###  Author:  Harry"
	echo "###  Email:   harryyue123@163.com"
	echo "###  Version: 14.04_V1.0"
	echo "###  Date:    2017-09-01"
	echo "##############################################################"
	echo ""
}

#Print the information of this script
introduction
cd $TOPDIR
echo $TOPDIR
echo -e $GREEN "Starting to install..." $RESET
exit 1

#Install and configure the git
echo "[1/]Begin to install git and gitk..."
echo $1 | sudo -S apt-get -y install git gitk
cp gitconfig ~/.gitconfig 
if [ $? != 0 ]
then
	echo -e $RED "[ERROR] Can't find gitconfig..." $RESET
	exit 1
fi
echo "[1/]done."

#Install and apply for powerline
echo "[2/]Begin to install powerline ..."
echo $1 | sudo -S apt-get -y install python-pip
pip install git+git://github.com/powerline/powerline
wget https://github.com/powerline/powerline/raw/develop/font/PowerlineSymbols.otf
wget https://github.com/powerline/powerline/raw/develop/font/10-powerline-symbols.conf
echo $1 | sudo -S mv PowerlineSymbols.otf /usr/share/fonts/
fc-cache -vf /usr/share/fonts/
echo $1 | sudo -S  mv 10-powerline-symbols.conf /etc/fonts/conf.d/
echo "[2/]done."

#Install and configure vim
echo "[3/]Begin to install vim and ctags ..."
echo $1 | sudo -S apt-get -y instll vim ctags
cd vimconfig
cp -rf * ~
if [ $? != 0 ]
then
	echo -e $RED "[ERROR] Can't find vim configure files..." $RESET
	exit 1
fi
cd -
echo "[3/]done."

#Install ssh server
echo "[4/]Begin to install ssh-server..."
echo $1 | sudo -S apt-get -y install openssh-server
echo "[4/]done."

#Install and tmux tool
echo "[5/]Install tmux..."
echo $1 | sudo -S apt-get -y install tmux
cp tmux.conf ~/.tmux.conf 
if [ $? != 0 ]
then
	echo -e $RED "[ERROR] Can't find tmux.conf..." $RESET
	exit 1
fi
echo "[5/]done."

echo -e $GREEN "Finish..." $RESET
exit 0
