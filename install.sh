#/bin/bash
#

set -e

TOPDIR=`pwd`
CONF="$TOPDIR/conf"
PKG="$TOPDIR/pkg"
app="git gitk gitg pv vim ctags minicom tmux openssh-server audacity wine"
deb=`find $PKG -name "*.deb" -exec basename {} \;| sort`

RED="\033[31;1m"
GREEN="\033[32;1m"
RESET="\033[0m"


introduction()
{
	echo ""
	echo "###############   Ubuntu Enviromrnt Install    ###############"
	echo ""
	echo "Author:    Harry"
	echo "Email:     harryyue123@163.com"
	echo "Version:   14.04_V2.0"
	echo "Create:    2017-09-01"
	echo "Update:    2019-04-06"
	echo "Description："
	echo "  We can auto-install below tools by this script,if also"
	echo "  need install other tools,you can update this script to "
	echo "  achieve it."
	echo "Tools:"
	echo "$app"
	echo ""
	echo "Deb package:"
	echo "$deb"
	echo ""
	echo "Other application:"
	echo "StarUML-3.1.0 repo"
	echo "##############################################################"
	echo ""
}

#Print the information of this script
introduction

cd $TOPDIR
echo -e $GREEN "Starting to install..." $RESET

echo "Update the source list and application."
echo $1 | sudo -S apt-get update
echo $1 | sudo -S apt-get upgrade
echo "done"

#Install and configure the git
echo "[1/4]Begin to install tools:$app"
echo $1 | sudo -S apt-get -y install $app
echo "[1/4]done."

echo "[2/4]Install the configure files"
conf_file=`find $CONF -maxdepth 1 -name ".*" | sort`
for key in $conf_file
do
	cp -rf $key ~
	if [ $? != 0 ]
	then
		echo -e $RED "[ERROR] Failed to copy `basename $key`" $RESET
		exit 1
	fi
done
echo "[2/4]done"

#Install kscope 1.6.2
#echo "[6/7]Install kscope..."
#echo $1 | sudo -S add-apt-repository ppa:fbirlik/kscope
#echo $1 | sudo -S apt-get update
#echo $1 | sudo -S apt-get -y install kscope-trinity cscope graphviz
#echo "[6/7]done."

source ~/.bashrc

echo "[3/4]Install *.deb pkg..."
cd $PKG
for pkg in $deb
do
	echo "Intall PKG:$pkg"
echo $1 | sudo -S dpkg -i -y `basename $pkg`
done
echo "[3/4]done"

echo "[4/4]Install StarUML-3.1.0,repo,fastboot,tmuxStart.sh"
mkdir -p ~/bin && cd ~/bin && wget
"https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" && chmod a+x appimagetool-x86_64.AppImage
cd StarUML && appimagetool-x86_64.AppImage squashfs-root ~/bin/StarUML-3.1.0-update

cp -rf StarUML/staruml.png repo fastboot tmuxStart.sh  ~/bin 
cp StarUML/StarUML-3.1.0.desktop  ~/Desktop
echo "[4/4]done"

echo "Application install finished,re-update the source list and application."
echo $1 | sudo -S apt-get update
echo $1 | sudo -S apt-get upgrade
echo "done"

cd $TOPDIR

echo -e $GREEN "Finish..." $RESET
exit 0
