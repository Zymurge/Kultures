ECHO OFF
echo Separate running of unit tests with sinon mocks from tests dependent on other services
echo -- this is a workaround for a bunch of weird behavior where mocks get mixed up
echo -- across the different test files
echo Protocol:
echo  - unit tests start with 'test_'
echo  - dependent tests start with '_test_'
call node_modules/.bin/mocha test/test*
call node_modules/.bin/mocha test/_test*
