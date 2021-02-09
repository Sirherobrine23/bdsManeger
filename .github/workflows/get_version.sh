#!/bin/bash
v=`cat package.json | jq '.version'|sed 's|"||g'`
d=`cat package.json | jq '.dependencies' | tr "\n" " " | sed 's|\^||g' | sed 's|  ||g'`
echo "bds_api_version=${v}" >> $GITHUB_ENV
echo "bds_api_depe=${d}" >> $GITHUB_ENV