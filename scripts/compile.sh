#!/bin/sh
SCRIPT_PATH=`dirname $0`
echo "amqp-coffee Compiling coffeescript to bin/"
echo $SCRIPT_PATH

rm -rf $SCRIPT_PATH/../bin
mkdir $SCRIPT_PATH/../bin

cp -r $SCRIPT_PATH/../src $SCRIPT_PATH/../bin/

# compile all coffeescript files
find $SCRIPT_PATH/../bin -name "*.coffee" | xargs $SCRIPT_PATH/../node_modules/coffee-script/bin/coffee --compile
# remove all coffeescript files
find $SCRIPT_PATH/../bin -name "*.coffee" | xargs rm
