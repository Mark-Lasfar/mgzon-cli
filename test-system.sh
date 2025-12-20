#!/bin/bash

echo "🔍 MGZON CLI System Test Suite"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local command="$2"
    local expected_exit="$3"

    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    echo -e "${YELLOW}Command: ${command}${NC}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if eval "$command"; then
        actual_exit=$?
        if [ "$actual_exit" -eq "$expected_exit" ] 2>/dev/null || [ "$expected_exit" = "any" ]; then
            echo -e "${GREEN}✅ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ FAILED (Expected exit code: $expected_exit, Got: $actual_exit)${NC}"
        fi
    else
        actual_exit=$?
        if [ "$expected_exit" = "any" ] || [ "$actual_exit" -eq "$expected_exit" ]; then
            echo -e "${GREEN}✅ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ FAILED (Expected exit code: $expected_exit, Got: $actual_exit)${NC}"
        fi
    fi
}

echo -e "\n${BLUE}📦 Testing CLI Build & Installation${NC}"
echo "======================================="

run_test "CLI Version Check" "node dist/index.js --version" "0"
run_test "CLI Help Display" "node dist/index.js --help | head -5" "0"

echo -e "\n${BLUE}🌐 Testing API Connectivity${NC}"
echo "================================"

run_test "Health Endpoint (HTTP 200)" "curl -s -o /dev/null -w '%{http_code}' https://af354cda3bc2.ngrok-free.app/api/v1/health" "200"
run_test "Health Endpoint Response" "curl -s https://af354cda3bc2.ngrok-free.app/api/v1/health | grep -q 'success.*true'" "0"

echo -e "\n${BLUE}🔧 Testing CLI Commands${NC}"
echo "==========================="

run_test "Config List Command" "timeout 5 node dist/index.js config --list 2>/dev/null | grep -q 'API URL'" "0"
run_test "Whoami Command (Cached)" "timeout 5 node dist/index.js whoami 2>/dev/null | grep -q 'elasfar'" "0"

echo -e "\n${BLUE}📊 Testing Code Quality${NC}"
echo "============================"

run_test "ESLint Check (No Errors)" "npm run lint 2>&1 | grep -c '✖' | grep -q '^0$'" "0"
run_test "TypeScript Compilation" "npm run build" "0"

echo -e "\n${BLUE}🔒 Testing Security${NC}"
echo "======================="

run_test "No Security Vulnerabilities" "npm audit --audit-level high 2>&1 | grep -q 'found 0 vulnerabilities'" "0"

echo -e "\n${BLUE}📋 Test Summary${NC}"
echo "=================="
echo -e "Tests Run: ${TESTS_RUN}"
echo -e "Tests Passed: ${TESTS_PASSED}"
echo -e "Tests Failed: $((TESTS_RUN - TESTS_PASSED))"
echo -e "Success Rate: $((TESTS_PASSED * 100 / TESTS_RUN))%"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! System is healthy.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. System needs attention.${NC}"
    exit 1
fi