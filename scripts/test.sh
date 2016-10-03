#!/bin/sh

# default to all the tests
GREP=""
# don't run coverage by default
COVERAGE=false

# disable nodejs debugging by default
NODE_DEBUG=false

ROOT=`git rev-parse --show-toplevel`
# the default directory to test from
FILES=$ROOT/test
# try to find mocha, no matter where it is
MOCHA=$(dirname $(/usr/bin/env node -e "console.log(require.resolve('mocha'))"))/bin/mocha
PATTERN="*.test.coffee"

USAGE='Usage: '$0' [options] [paths]\n\n'
USAGE=$USAGE'Options:\n'
USAGE=$USAGE'	-g	only run the tests whose names match this grep pattern\n'
USAGE=$USAGE'	-d	enable the nodejs debugger\n'
USAGE=$USAGE'	-p	only run the tests whole _files_ match this pattern\n'
USAGE=$USAGE'	-h	display this help information\n'
USAGE=$USAGE'	-c	display coverage output instead of pass/fail\n\n'
USAGE=$USAGE'Example:\n'
USAGE=$USAGE'# run only the sync.test.coffee test\n'
USAGE=$USAGE'	'$0' test/unit/sync.test.coffee\n\n'
USAGE=$USAGE'# run only the unit tests matching hello \n'
USAGE=$USAGE'	'$0' -g hello test/unit\n\n'

args=`getopt g:p:cdh $*`
# this is used if getopt finds an invalid option
if test $? != 0
then
  echo $USAGE
  exit 1
fi

set -- $args

while [ ! -z "$1" ]
do
  case "$1" in
    -c)
      COVERAGE=true
      ;;
    -d)
      NODE_DEBUG=true
      ;;
    -g)
      GREP=$2
      # shift another parameter off of grep, since it requires 2
      shift
      ;;
    -p)
      PATTERN=$2
      # shift another parameter off, since pattern requires an argument
      shift
      ;;
    -h)
      echo $USAGE
      exit 1
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Invalid option $1"
      echo $USAGE
      exit 1
      ;;
  esac

  shift
done

if [ "$#" -ne 0 ];then
  FILES=$@
fi


echo $PATTERN
# find all the tests to run
TESTS=`find $FILES -iname "$PATTERN"`

#ulimit -n 10000

pushd $ROOT/test/ssl/
./cleanSsl.sh
./setupSsl.sh
popd

$ROOT/scripts/compile.sh

if $COVERAGE; then
  _MOCHA=$(dirname $(/usr/bin/env node -e "console.log(require.resolve('mocha'))"))/bin/_mocha
  ISTANBUL=$(dirname $(/usr/bin/env node -e "console.log(require.resolve('istanbul'))"))/lib/cli.js
  AMQP_TEST=1 NODE_PATH=$ROOT/bin $ISTANBUL cover $_MOCHA -- --require 'coffee-script' --compilers coffee:coffee-script --reporter spec --ui bdd --grep "$GREP" $TESTS
  open $ROOT/coverage/lcov-report/index.html

  # rm -rf $ROOT/bin-cov
  # jscoverage $ROOT/bin $ROOT/bin-cov

  # AMQP_TEST=1 NODE_PATH=$ROOT/bin-cov $MOCHA --require 'coffee-script' --compilers coffee:coffee-script --reporter html-cov --ui bdd --grep "$GREP" $TESTS > $ROOT/coverage.html
  # open $ROOT/coverage.html
else

  AMQP_TEST=1 NODE_PATH=$ROOT/bin $MOCHA --require 'coffee-script' --compilers coffee:coffee-script --reporter spec --ui bdd --timeout 10000 --grep "$GREP" $TESTS

fi


