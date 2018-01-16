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
	echo "###  Author:    Harry"
	echo "###  Email:     harryyue123@163.com"
	echo "###  Version:   14.04_V1.0"
	echo "###  Create:    2017-09-01"
	echo "###  Update:    2018-01-16"
	echo "###  Description："
	echo "###  We can auto-install below tools by this script,if also"
	echo "###  need install other tools,you can update this script to "
	echo "###  achieve it."
	echo "###  Tools:"
	echo "###  	 1.Environment:tmux,powerline,pv"
	echo "###  	 2.Basic Tools:vim,minicom and ctags"
	echo "###  	 3.Code Management:git，gitk and gitg"
	echo "###  	 4.Code Viewer:kscope 1.6.2 ,cscope and graphviz"
	echo "###  	 5.Net Tools:ssh server"
	echo "###  	 6.Audio Tools:audacity"
	echo "##############################################################"
	echo ""
}

#Print the information of this script
introduction
cd $TOPDIR
echo -e $GREEN "Starting to install..." $RESET

#Install and configure the git
echo "[1/7]Begin to install git and gitk..."
echo $1 | sudo -S apt-get -y install git gitk gitg
cp gitconfig ~/.gitconfig 
if [ $? != 0 ]
then
	echo -e $RED "[ERROR] Can't find gitconfig..." $RESET
	exit 1
fi
echo "[1/7]done."

#Install and apply for powerline
#echo "[2/6]Begin to install powerline ..."
#echo $1 | sudo -S apt-get -y install python-pip
#pip install git+git://github.com/powerline/powerline
#wget https://github.com/powerline/powerline/raw/develop/font/PowerlineSymbols.otf
#wget https://github.com/powerline/powerline/raw/develop/font/10-powerline-symbols.conf
#echo $1 | sudo -S mv PowerlineSymbols.otf /usr/share/fonts/
#fc-cache -vf /usr/share/fonts/
#echo $1 | sudo -S  mv 10-powerline-symbols.conf /etc/fonts/conf.d/
echo "[2/7]Begin to install the pv"
echo $1 | sudo -S apt-get -y install pv
echo "[2/7]done."

#Install and configure vim
echo "[3/7]Begin to install vim and ctags ..."
echo $1 | sudo -S apt-get -y install vim ctags minicom
rsync -a --exclude=vimconfig/ReadMe vimconfig/* ~
if [ $? != 0 ]
then
	echo -e $RED "[ERROR] Can't find vim configure files..." $RESET
	exit 1
fi
echo "[3/7]done."

#Install ssh server
echo "[4/7]Begin to install ssh-server..."
echo $1 | sudo -S apt-get -y install openssh-server
echo "[4/7]done."

#Install and tmux tool
echo "[5/7]Install tmux..."
echo $1 | sudo -S apt-get -y install tmux
cp tmux.conf ~/.tmux.conf 
if [ $? != 0 ]
then
	echo -e $RED "[ERROR] Can't find tmux.conf..." $RESET
	exit 1
fi
echo "[5/7]done."

#Install kscope 1.6.2
echo "[6/7]Install kscope..."
echo $1 | sudo -S add-apt-repository ppa:fbirlik/kscope
echo $1 | sudo -S apt-get update
echo $1 | sudo -S apt-get -y install kscope-trinity cscope graphviz
echo "[6/7]done."

echo "[7/7]Begin to install ssh-server..."
echo $1 | sudo -S apt-get -y install audacity
echo "[7/7]done."

source ~/.bashrc
echo $1 | sudo -S apt-get update
echo $1 | sudo -S apt-get upgrade

echo -e $GREEN "Finish..." $RESET
exit 0
