# Test Modal API Endpoints with PowerShell
# This script tests all Modal endpoints to verify deployment

Write-Host "Starting Modal API endpoint tests..." -ForegroundColor Cyan
Write-Host "Note: Cold start may take 5-10 seconds on first request" -ForegroundColor Yellow
Write-Host ""

$endpoints = @{
    health = "https://ibrahimiftikharr--rentmates-compatibility-health-endpoint.modal.run"
    predict = "https://ibrahimiftikharr--rentmates-compatibility-predict-endpoint.modal.run"
    batchPredict = "https://ibrahimiftikharr--rentmates-compatibility-predict-batch--ced605.modal.run"
}

$results = @{}

# Test Health Endpoint
Write-Host "=== Testing Health Endpoint ===" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $endpoints.health -Method Get -TimeoutSec 15
    Write-Host "[OK] Health endpoint response:" -ForegroundColor Green
    Write-Host $($response | ConvertTo-Json)
    $results.health = $true
} catch {
    Write-Host "[ERROR] Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.health = $false
}
Write-Host ""

# Test Predict Endpoint
Write-Host "=== Testing Predict Endpoint ===" -ForegroundColor Cyan
$sampleStudent1 = @{
    university = "NTU"
    course = "Computer Science"
    yearOfStudy = "Year 2"
    age = 21
    nationality = "Singapore"
    bio = "I am a CS student who loves coding and gaming. I prefer quiet study environments."
    budget = @{ min = 600; max = 900 }
    propertyType = "HDB"
    smoking = $false
    petFriendly = $false
    cleanliness = 8
    noiseTolerance = 4
}

$sampleStudent2 = @{
    university = "NTU"
    course = "Computer Engineering"
    yearOfStudy = "Year 2"
    age = 22
    nationality = "Malaysia"
    bio = "Engineering student interested in robotics. I enjoy quiet environments and clean spaces."
    budget = @{ min = 700; max = 1000 }
    propertyType = "HDB"
    smoking = $false
    petFriendly = $false
    cleanliness = 7
    noiseTolerance = 5
}

try {
    $predictBody = @{
        student1 = $sampleStudent1
        student2 = $sampleStudent2
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $endpoints.predict -Method Post -Body $predictBody -ContentType "application/json" -TimeoutSec 15
    Write-Host "[OK] Predict endpoint response:" -ForegroundColor Green
    Write-Host "  Success: $($response.success)"
    Write-Host "  Compatibility Score: $($response.compatibilityScore)" -ForegroundColor Yellow
    Write-Host "  Method: $($response.method)"
    $results.predict = $true
} catch {
    Write-Host "[ERROR] Predict endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.predict = $false
}
Write-Host ""

# Test Batch Predict Endpoint
Write-Host "=== Testing Batch Predict Endpoint ===" -ForegroundColor Cyan
$sampleStudent3 = @{
    university = "NUS"
    course = "Business Administration"
    yearOfStudy = "Year 3"
    age = 23
    nationality = "China"
    bio = "Business student who loves parties and socializing. Very outgoing and friendly."
    budget = @{ min = 800; max = 1200 }
    propertyType = "Condo"
    smoking = $true
    petFriendly = $true
    cleanliness = 5
    noiseTolerance = 9
}

try {
    $batchBody = @{
        currentStudent = $sampleStudent1
        otherStudents = @($sampleStudent2, $sampleStudent3)
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $endpoints.batchPredict -Method Post -Body $batchBody -ContentType "application/json" -TimeoutSec 20
    Write-Host "[OK] Batch predict endpoint response:" -ForegroundColor Green
    Write-Host "  Success: $($response.success)"
    Write-Host "  Total Students: $($response.totalStudents)"
    Write-Host "  Scores:"
    $response.scores | ForEach-Object {
        Write-Host "    - Score: $($_.compatibilityScore)" -ForegroundColor Yellow
    }
    $results.batchPredict = $true
} catch {
    Write-Host "[ERROR] Batch predict endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    $results.batchPredict = $false
}
Write-Host ""

# Summary
Write-Host "=== Test Results Summary ===" -ForegroundColor Cyan
Write-Host "Health Endpoint: $(if ($results.health) { '[PASS]' } else { '[FAIL]' })" -ForegroundColor $(if ($results.health) { 'Green' } else { 'Red' })
Write-Host "Predict Endpoint: $(if ($results.predict) { '[PASS]' } else { '[FAIL]' })" -ForegroundColor $(if ($results.predict) { 'Green' } else { 'Red' })
Write-Host "Batch Predict Endpoint: $(if ($results.batchPredict) { '[PASS]' } else { '[FAIL]' })" -ForegroundColor $(if ($results.batchPredict) { 'Green' } else { 'Red' })
Write-Host ""

$allPassed = $results.Values | Where-Object { $_ -eq $false } | Measure-Object | Select-Object -ExpandProperty Count
if ($allPassed -eq 0) {
    Write-Host "[ALL TESTS PASSED]" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[SOME TESTS FAILED]" -ForegroundColor Red
    exit 1
}
