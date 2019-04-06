#!/bin/sh
#
# name     : tmuxen， tmux environment made easy
# author   : harry.yue harryyue123@163.com
# license  : GPL
# created  : 2017 Oct 11
# modified : 2019 Feb 14
#

cmd=$(which tmux) # tmux path
session=harry   # session name

if [ -z $cmd ]; then
	echo "You need to install tmux."
	exit 1
fi

$cmd has -t $session

if [ $? != 0 ]; then
	$cmd new  -d -n TMP -s $session
	$cmd neww -n Code -t $session -c "~/"
	$cmd neww -n backend -t $session

	$cmd selectw -t $session:1
fi

$cmd att -t $session

exit 0
