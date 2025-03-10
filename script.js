document.addEventListener('DOMContentLoaded', () => {
    const bordroForm = document.getElementById('bordroForm');
    const result = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    const printBtn = document.getElementById('printBtn');
    const newCalculation = document.getElementById('newCalculation');
    const isRetiredSelect = document.getElementById('isRetired');
    const sgkEmployeeRateInput = document.getElementById('sgkEmployeeRate');
    const sgkRateInfo = document.getElementById('sgkRateInfo');
    const retiredAbsenceWarning = document.getElementById('retiredAbsenceWarning');
    const unemploymentRateGroup = document.getElementById('unemploymentRateGroup');
    const unemploymentRateInfo = document.getElementById('unemploymentRateInfo');
    const unemploymentEmployeeRateInput = document.getElementById('unemploymentEmployeeRate');
    
    // Set default date to current month
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    document.getElementById('period').value = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Handle retired employee selection
    isRetiredSelect.addEventListener('change', function() {
        if (this.value === 'yes') {
            sgkEmployeeRateInput.value = '7';
            sgkRateInfo.textContent = 'Emekli çalışan için SGK işçi payı %7\'dir.';
            retiredAbsenceWarning.classList.remove('hidden');
            unemploymentEmployeeRateInput.value = '0';
            unemploymentRateInfo.innerHTML = '<strong>Emekli çalışanlar için işsizlik sigortası kesilmez.</strong>';
            unemploymentEmployeeRateInput.disabled = true;
        } else {
            sgkEmployeeRateInput.value = '14';
            sgkRateInfo.textContent = 'Normal çalışan için SGK işçi payı %14\'tür.';
            retiredAbsenceWarning.classList.add('hidden');
            unemploymentEmployeeRateInput.value = '1';
            unemploymentRateInfo.textContent = 'Normal çalışanlar için işsizlik sigortası işçi payı %1\'dir.';
            unemploymentEmployeeRateInput.disabled = false;
        }
    });
    
    // Set up collapsible sections
    const collapsibles = document.querySelectorAll('.collapsible h3');
    collapsibles.forEach(collapsible => {
        collapsible.addEventListener('click', () => {
            const parent = collapsible.parentElement;
            const content = parent.querySelector('.collapsible-content');
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                parent.classList.add('active');
            } else {
                content.classList.add('hidden');
                parent.classList.remove('active');
            }
        });
    });
    
    bordroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateSalary();
    });
    
    printBtn.addEventListener('click', () => {
        window.print();
    });
    
    newCalculation.addEventListener('click', () => {
        result.classList.add('hidden');
        bordroForm.elements[0].focus();
    });
    
    function formatMoney(amount) {
        return new Intl.NumberFormat('tr-TR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(amount);
    }
    
    // Define tax brackets
    const taxBrackets = [
        { limit: 158000, rate: 0.15 },
        { limit: 330000, rate: 0.20 },
        { limit: 1200000, rate: 0.27 },
        { limit: 4300000, rate: 0.35 },
        { limit: Infinity, rate: 0.40 }
    ];
    
    function calculateProgressiveTax(monthlyIncome, previousIncome) {
        // Initialize variables
        let totalTax = 0;
        let currentTaxDetails = [];
        let hasMultipleBrackets = false;
        
        // Calculate total cumulative income for display purposes
        const totalCumulativeIncome = previousIncome + monthlyIncome;
        
        // We need to handle three cases:
        // 1. Previous income falls entirely in one bracket, current income stays in same bracket
        // 2. Previous income falls in one bracket, current income spans multiple brackets
        // 3. Previous income and current income fall in different brackets
        
        // First, determine which bracket the previous income falls into
        let prevIncomeBracketIndex = 0;
        for (let i = 0; i < taxBrackets.length; i++) {
            if (previousIncome < taxBrackets[i].limit) {
                prevIncomeBracketIndex = i;
                break;
            }
        }
        
        // Now calculate tax on the current month's income
        let remainingIncome = monthlyIncome;
        let currentBracketIndex = prevIncomeBracketIndex;
        
        while (remainingIncome > 0 && currentBracketIndex < taxBrackets.length) {
            const bracket = taxBrackets[currentBracketIndex];
            const prevBracket = currentBracketIndex > 0 ? taxBrackets[currentBracketIndex - 1] : { limit: 0 };
            
            // Calculate the amount of space left in the current bracket
            let availableInBracket;
            
            if (currentBracketIndex === prevIncomeBracketIndex) {
                // If we're in the same bracket as previous income,
                // the available space is the bracket limit minus the previous income
                availableInBracket = bracket.limit - previousIncome;
            } else {
                // If we're in a new bracket, the available space is the full bracket size
                availableInBracket = bracket.limit - prevBracket.limit;
            }
            
            // How much of the current income fits in this bracket?
            const incomeInThisBracket = Math.min(remainingIncome, availableInBracket);
            
            if (incomeInThisBracket > 0) {
                const taxForThisBracket = incomeInThisBracket * bracket.rate;
                
                // Add to the total tax and record details
                totalTax += taxForThisBracket;
                
                // Record the details for display
                currentTaxDetails.push({
                    bracket: currentBracketIndex,
                    rate: bracket.rate,
                    income: incomeInThisBracket,
                    tax: taxForThisBracket,
                    bracketStart: prevBracket.limit,
                    bracketEnd: bracket.limit
                });
                
                // Mark if we span multiple brackets
                if (currentTaxDetails.length > 1) {
                    hasMultipleBrackets = true;
                }
            }
            
            // Update remaining income and move to next bracket if needed
            remainingIncome -= incomeInThisBracket;
            currentBracketIndex++;
        }
        
        // If there's still income left (we've reached the highest bracket)
        if (remainingIncome > 0) {
            const highestBracket = taxBrackets[taxBrackets.length - 1];
            const prevBracket = taxBrackets[taxBrackets.length - 2];
            const taxForThisBracket = remainingIncome * highestBracket.rate;
            
            totalTax += taxForThisBracket;
            currentTaxDetails.push({
                bracket: taxBrackets.length - 1,
                rate: highestBracket.rate,
                income: remainingIncome,
                tax: taxForThisBracket,
                bracketStart: prevBracket.limit,
                bracketEnd: Infinity
            });
            
            hasMultipleBrackets = true;
        }
        
        // Calculate effective tax rate
        const effectiveTaxRate = totalTax / monthlyIncome;
        
        return {
            totalTax,
            effectiveTaxRate,
            taxDetails: currentTaxDetails,
            hasMultipleBrackets,
            totalCumulativeIncome,
            prevIncomeBracketIndex
        };
    }
    
    // Add this function before calculateSalary function to help with mobile table formatting:
    function createTableRow(cells) {
        // Create a row with proper data-label attributes for mobile
        return `<tr>${cells}</tr>`;
    }

    // Add a helper function to create table cells with data-label attributes
    function createTableCell(label, content, isHeader = false) {
        const tag = isHeader ? 'th' : 'td';
        return `<${tag} data-label="${label}">${content}</${tag}>`;
    }

    function calculateSalary() {
        // Get basic employee information
        const name = document.getElementById('name').value || 'Anonim Çalışan';
        const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
        const workDays = parseFloat(document.getElementById('workDays').value);
        const weekendHours = parseFloat(document.getElementById('weekendHours').value) || 0;
        const nightShiftHours = parseFloat(document.getElementById('nightShiftHours').value) || 0;
        const taxRate = parseFloat(document.getElementById('taxRate').value) / 100;
        const isRetired = document.getElementById('isRetired').value === 'yes';
        
        // Get previous income for this year
        const cumulativeIncome = parseFloat(document.getElementById('cumulativeIncome').value) || 0;
        const useProgressiveTax = document.getElementById('calculateProgressiveTax').value === 'yes';
        
        // Get absence information - now in hours, not days
        const annualLeaveHours = parseFloat(document.getElementById('annualLeave').value) || 0;
        const unpaidLeaveHours = parseFloat(document.getElementById('unpaidLeave').value) || 0;
        const absenceHours = parseFloat(document.getElementById('absence').value) || 0;
        const sickLeaveHours = parseFloat(document.getElementById('sickLeave').value) || 0;
        
        // For retired employees, all absences (except annual leave) are counted as unpaid leave
        let effectiveUnpaidLeaveHours = unpaidLeaveHours;
        if (isRetired) {
            effectiveUnpaidLeaveHours = unpaidLeaveHours + absenceHours + sickLeaveHours;
        }
        
        // Fixed values that were previously inputs
        const bonusHours = 75; // Fixed at 75 hours
        const healthBenefit = 686.21; // Fixed at 686.21 TL
        const heatingAllowance = 2227.88; // Fixed amount for "Yakacak Yardımı"
        
        // Get other information
        const advance = parseFloat(document.getElementById('advance').value) || 0;
        const childCount = parseInt(document.getElementById('childCount').value) || 0;
        const overtime = parseFloat(document.getElementById('overtime').value) || 0;
        
        // Get advanced settings
        const sgkEmployeeRate = parseFloat(document.getElementById('sgkEmployeeRate').value) / 100;
        const unemploymentEmployeeRate = isRetired ? 0 : parseFloat(document.getElementById('unemploymentEmployeeRate').value) / 100;
        const stampTaxRate = parseFloat(document.getElementById('stampTaxRate').value) / 100;
        const unionFeeEnabled = document.getElementById('unionFeeEnabled').value === 'yes';
        
        // Constants
        const dailyWorkHours = 7.5; // Standard work hours per day
        const daysInMonth = 30; // Standard for payroll calculations
        const workDaysInMonth = 22; // Average work days in a month (excluding weekends)
        
        // Calculate total working hours based on work days
        const totalWorkingHours = workDays * dailyWorkHours;
        
        // Calculate total working hours after deducting unpaid leave
        const workHoursAfterUnpaidLeave = Math.max(0, totalWorkingHours - effectiveUnpaidLeaveHours);
        
        // DÜZELTME: Çalışma saatlerini doğru şekilde dağıtalım
        // Hafta sonu ve yıllık izin saatleri, toplam çalışma saatinden düşülmeli
        
        // Normal çalışma saati = Toplam çalışma saati - Hafta sonu saatleri - Yıllık izin saatleri
        const actualWorkHours = Math.max(0, workHoursAfterUnpaidLeave - weekendHours - annualLeaveHours);
        
        // Ücretlerin hesaplanması
        const baseSalary = actualWorkHours * hourlyRate;          // Normal çalışma
        const annualLeavePay = annualLeaveHours * hourlyRate;     // Yıllık izin ücreti
        const weekendPay = weekendHours * hourlyRate;            // Hafta sonu çalışma ücreti (normal tarife)
        const overtimePay = overtime * hourlyRate * 2;           // Fazla mesai (2x)
        const nightShiftPay = nightShiftHours * hourlyRate * 0.1; // Gece çalışma (%10)
        const bonusPay = bonusHours * hourlyRate;                // İkramiye
        
        // Calculate standard allowances
        const childSupportPerChild = 250; // TL per child, example value
        const childSupportTotal = childCount * childSupportPerChild;
        
        // Calculate gross income
        const monthlyGrossIncome = baseSalary + weekendPay + overtimePay + nightShiftPay + 
                              bonusPay + annualLeavePay + childSupportTotal + 
                              heatingAllowance + healthBenefit;
        
        // Calculate union fee
        let unionFee = 0;
        if (unionFeeEnabled) {
            unionFee = hourlyRate * dailyWorkHours; // One day's wages
        }
        
        // Asgari ücret değerleri 2025 için
        const grossMinimumWage = 26005; // 2025 yılı brüt asgari ücreti TL
        const netMinimumWage = 22104;   // 2025 yılı net asgari ücreti TL
        
        // SGK ve işsizlik kesintileri hesaplamaları (Çalışanın kendi kesintileri)
        const sgkEmployeeDeduction = monthlyGrossIncome * sgkEmployeeRate;
        const unemploymentEmployeeDeduction = monthlyGrossIncome * unemploymentEmployeeRate;
        
        // Gelir Vergisi Matrahı hesaplaması - İstisna olmadan
        const rawTaxBase = monthlyGrossIncome - sgkEmployeeDeduction - unemploymentEmployeeDeduction;
        
        // Gelir vergisi hesaplaması - asgari ücret istisnası uygulanmadan önce
        let rawIncomeTax = 0;
        let taxDetails = null;
        let effectiveTaxRate = taxRate;
        let currentBracketIndex = 0;
        let nextBracketIndex = 0;
        
        if (useProgressiveTax) {
            // Determine current tax bracket before this month
            for (let i = 0; i < taxBrackets.length; i++) {
                if (cumulativeIncome < taxBrackets[i].limit) {
                    currentBracketIndex = i;
                    break;
                }
            }
            
            // Calculate progressive tax with our improved function
            const taxCalculation = calculateProgressiveTax(rawTaxBase, cumulativeIncome);
            rawIncomeTax = taxCalculation.totalTax;
            taxDetails = taxCalculation.taxDetails;
            effectiveTaxRate = taxCalculation.effectiveTaxRate;
            
            // Determine next bracket after this month's income
            const totalCumulative = cumulativeIncome + rawTaxBase;
            for (let i = 0; i < taxBrackets.length; i++) {
                if (totalCumulative < taxBrackets[i].limit) {
                    nextBracketIndex = i;
                    break;
                }
                // If we've gone through all brackets, we're in the highest bracket
                if (i === taxBrackets.length - 1) {
                    nextBracketIndex = taxBrackets.length - 1;
                }
            }
        } else {
            // Fix the flat tax calculation
            rawIncomeTax = rawTaxBase * taxRate;
        }
        
        // GELİR VERGİSİ İSTİSNASI: Asgari ücret üzerinden hesaplanan gelir vergisi tutarı
        // 7194 Sayılı Kanun uyarınca: Aylık asgari ücret tutarında istisna uygulanır
        
        // ÖNEMLİ: Asgari ücret için SGK ve işsizlik kesintileri HER ZAMAN standart oranlarda (%14 ve %1) hesaplanır
        // Emekli çalışanlar için bile asgari ücret istisnası bu oranlara göre hesaplanır
        const standardSGKRate = 0.14; // Standart SGK işçi payı %14
        const standardUnemploymentRate = 0.01; // Standart işsizlik sigortası işçi payı %1
        
        // Asgari ücret SGK ve işsizlik kesintileri (standart oranlarda)
        const minimumWageSGK = grossMinimumWage * standardSGKRate;
        const minimumWageUnemployment = grossMinimumWage * standardUnemploymentRate;
        
        // Asgari ücretin vergi matrahı (SGK ve İşsizlik kesintileri düşülmüş) - standart oranlarda
        const minimumWageTaxBase = grossMinimumWage - minimumWageSGK - minimumWageUnemployment;
        
        // Asgari ücretin gelir vergisi (İstisna tutarı)
        // Mevzuata uygun: Gelir vergisi = gelir vergisi matrahı * vergi oranı
        let minimumWageIncomeTax;
        
        if (useProgressiveTax) {
            // Asgari ücret gelir vergisi kademeli sistemle hesaplanır, her zaman 1. dilimde olacak
            minimumWageIncomeTax = minimumWageTaxBase * taxBrackets[0].rate; // %15
        } else {
            // Sabit vergi oranıyla hesaplama
            minimumWageIncomeTax = minimumWageTaxBase * taxRate;
        }
        
        // İstisna sonrası ödenecek gelir vergisi hesabı: Gelir vergisi - gelir vergisi istisnası
        const incomeTax = Math.max(0, rawIncomeTax - minimumWageIncomeTax);
        
        // DAMGA VERGİSİ İSTİSNASI HESAPLAMASI
        // Brüt asgari ücrete kadar olan kısımdan damga vergisi alınmaz
        // Damga vergisi sadece brüt asgari ücreti aşan kısım üzerinden hesaplanır

        // 1. Damga vergisi matrahı - Brüt kazanç toplamı (istisna uygulanmadan önce)
        const rawStampTaxBase = monthlyGrossIncome;
        
        // 2. İstisna kapsamı - Brüt asgari ücret tutarı 
        const stampTaxExemption = grossMinimumWage;
        
        // 3. İstisna sonrası matrah = Brüt kazanç - Brüt asgari ücret
        // Eğer brüt kazanç asgari ücretin altındaysa matrah 0 olur
        const stampTaxBase = Math.max(0, rawStampTaxBase - stampTaxExemption);
        
        // 4. Damga vergisi = İstisna sonrası matrah × Damga vergisi oranı
        const stampTax = stampTaxBase * stampTaxRate;
        
        // Calculate total deductions with the updated tax calculations
        const totalDeductions = sgkEmployeeDeduction + unemploymentEmployeeDeduction + 
                             incomeTax + stampTax + advance + unionFee + healthBenefit;
        
        // Calculate net salary with the updated deductions
        const netSalary = monthlyGrossIncome - totalDeductions;
        
        // Generate tax breakdown HTML if we're using progressive tax
        let taxBreakdownHTML = '';
        if (useProgressiveTax && taxDetails && taxDetails.length > 0) {
            // Determine bracket names for display
            const currentBracketName = getBracketName(currentBracketIndex);
            const nextBracketName = getBracketName(nextBracketIndex);
            
            // Calculate next bracket threshold if not in highest bracket
            const totalCumulativeAfterThisMonth = cumulativeIncome + rawTaxBase;
            let nextBracketInfo = "";
            
            if (nextBracketIndex < taxBrackets.length - 1) {
                // If not at the highest bracket, calculate distance to next
                const nextHigherBracketIndex = nextBracketIndex + 1;
                const nextBracketThreshold = taxBrackets[nextBracketIndex].limit;
                const nextBracketRate = taxBrackets[nextHigherBracketIndex].rate;
                const amountUntilNextBracket = nextBracketThreshold - totalCumulativeAfterThisMonth;
                const nextBracketRatePercent = (nextBracketRate * 100).toFixed(0);
                
                nextBracketInfo = `<p>Bir sonraki vergi dilimine (${nextBracketRatePercent}%) girmek için kalan matrah: <strong>${formatMoney(amountUntilNextBracket)} TL</strong></p>`;
            }
            
            // Build a clearer tax calculation table that matches expected results
            // We need to recalculate the actual bracket distribution to show it correctly
            let distributedTaxHTML = '';
            let totalTaxAmount = 0;
            
            // Completely rewrite this section to fix the issue with incorrect tax brackets showing up
            // First, determine the upper bracket this person falls into
            let inBrackets = [];
            
            if (cumulativeIncome < taxBrackets[0].limit) {
                inBrackets.push(0); // First bracket
                if (cumulativeIncome + rawTaxBase > taxBrackets[0].limit) {
                    inBrackets.push(1); // Second bracket
                    
                    if (cumulativeIncome + rawTaxBase > taxBrackets[1].limit) {
                        inBrackets.push(2); // Third bracket
                        
                        if (cumulativeIncome + rawTaxBase > taxBrackets[2].limit) {
                            inBrackets.push(3); // Fourth bracket
                            
                            if (cumulativeIncome + rawTaxBase > taxBrackets[3].limit) {
                                inBrackets.push(4); // Fifth bracket
                            }
                        }
                    }
                }
            } else if (cumulativeIncome < taxBrackets[1].limit) {
                inBrackets.push(1); // Second bracket
                
                if (cumulativeIncome + rawTaxBase > taxBrackets[1].limit) {
                    inBrackets.push(2); // Third bracket
                    
                    if (cumulativeIncome + rawTaxBase > taxBrackets[2].limit) {
                        inBrackets.push(3); // Fourth bracket
                        
                        if (cumulativeIncome + rawTaxBase > taxBrackets[3].limit) {
                            inBrackets.push(4); // Fifth bracket
                        }
                    }
                }
            } else if (cumulativeIncome < taxBrackets[2].limit) {
                inBrackets.push(2); // Third bracket
                
                if (cumulativeIncome + rawTaxBase > taxBrackets[2].limit) {
                    inBrackets.push(3); // Fourth bracket
                    
                    if (cumulativeIncome + rawTaxBase > taxBrackets[3].limit) {
                        inBrackets.push(4); // Fifth bracket
                    }
                }
            } else if (cumulativeIncome < taxBrackets[3].limit) {
                inBrackets.push(3); // Fourth bracket
                
                if (cumulativeIncome + rawTaxBase > taxBrackets[3].limit) {
                    inBrackets.push(4); // Fifth bracket
                }
            } else {
                inBrackets.push(4); // Fifth bracket
            }
            
            // Now calculate tax for each bracket the person falls into
            let remainingIncome = rawTaxBase;
            totalTaxAmount = 0;
            
            for (let i = 0; i < inBrackets.length; i++) {
                const bracketIndex = inBrackets[i];
                const bracket = taxBrackets[bracketIndex];
                const prevBracketLimit = bracketIndex > 0 ? taxBrackets[bracketIndex - 1].limit : 0;
                
                // How much of this bracket is available?
                let availableInBracket;
                let incomeInThisBracket;
                
                if (i === 0) {
                    // First bracket the person falls into
                    if (cumulativeIncome > prevBracketLimit) {
                        // We've already used up part of this bracket
                        availableInBracket = bracket.limit - cumulativeIncome;
                    } else {
                        // We haven't hit this bracket yet with previous income
                        availableInBracket = bracket.limit - prevBracketLimit;
                    }
                    
                    incomeInThisBracket = Math.min(remainingIncome, availableInBracket);
                } else {
                    // Subsequent brackets
                    availableInBracket = bracket.limit - prevBracketLimit;
                    incomeInThisBracket = Math.min(remainingIncome, availableInBracket);
                }
                
                if (incomeInThisBracket > 0) {
                    const taxForThisBracket = incomeInThisBracket * bracket.rate;
                    totalTaxAmount += taxForThisBracket;
                    
                    remainingIncome -= incomeInThisBracket;
                    
                    distributedTaxHTML += `
                    <tr>
                        <td data-label="Vergi Dilimi">${formatMoney(prevBracketLimit)} TL - ${bracket.limit === Infinity ? 'Üzeri' : formatMoney(bracket.limit) + ' TL'}</td>
                        <td data-label="Oran">%${(bracket.rate * 100).toFixed(0)}</td>
                        <td data-label="Vergilenebilir Gelir">${formatMoney(incomeInThisBracket)} ₺</td>
                        <td data-label="Hesaplanan Vergi">${formatMoney(taxForThisBracket)} ₺</td>
                    </tr>`;
                }
                
                if (remainingIncome <= 0) {
                    break;
                }
            }
            
            // Now we have a clearer and more accurate breakdown
            taxBreakdownHTML = `
                <div class="tax-details">
                    <h4>Gelir Vergisi Hesabı</h4>
                    <p>Bu ayki brüt geliriniz: ${formatMoney(monthlyGrossIncome)} TL</p>
                    <p>SGK İşçi Payı: -${formatMoney(sgkEmployeeDeduction)} TL</p>
                    <p>İşsizlik Sigortası İşçi Payı: -${formatMoney(unemploymentEmployeeDeduction)} TL</p>
                    <p><strong>Gelir Vergisi Matrahı:</strong> ${formatMoney(rawTaxBase)} TL</p>
                    <p>Yıl içi toplam vergi matrahı (önceki aylar): ${formatMoney(cumulativeIncome)} TL</p>
                    <p>Önceki vergi diliminiz: ${currentBracketName}</p>
                    <p>Bu ayın sonundaki toplam vergi matrahı: ${formatMoney(cumulativeIncome + rawTaxBase)} TL</p>
                    <p><strong>Gelecek ay başlangıcındaki vergi diliminiz:</strong> ${nextBracketName}</p>
                    ${nextBracketInfo}
                    
                    <table class="tax-breakdown">
                        <thead>
                            <tr>
                                <th>Vergi Dilimi</th>
                                <th>Oran</th>
                                <th>Vergilenebilir Gelir (₺)</th>
                                <th>Hesaplanan Vergi (₺)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${distributedTaxHTML}
                            <tr class="summary-row">
                                <td colspan="3" data-label=""><strong>İstisna Öncesi Toplam Gelir Vergisi</strong></td>
                                <td data-label=""><strong>${formatMoney(totalTaxAmount)} ₺</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="exemption-details">
                        <h5>Asgari Ücret İstisnaları (7194 Sayılı Kanun)</h5>
                        <div class="exemption-calculation">
                            <h6>1. Gelir Vergisi İstisnası</h6>
                            <p>Brüt Asgari Ücret: ${formatMoney(grossMinimumWage)} TL</p>
                            <p>Standart SGK Kesintisi (%14): -${formatMoney(minimumWageSGK)} TL</p>
                            <p>Standart İşsizlik Kesintisi (%1): -${formatMoney(minimumWageUnemployment)} TL</p>
                            <p>Asgari Ücretin Vergi Matrahı: ${formatMoney(minimumWageTaxBase)} TL</p>
                            <p>Asgari Ücret Gelir Vergisi (%${useProgressiveTax ? '15' : (taxRate * 100).toFixed(0)}): ${formatMoney(minimumWageIncomeTax)} TL</p>
                            <p>İstisna Sonrası Ödenecek Gelir Vergisi: ${formatMoney(incomeTax)} TL</p>
                        </div>
                        
                        <div class="exemption-calculation">
                            <h6>2. Damga Vergisi İstisnası</h6>
                            <p>Brüt Kazanç (İstisna Öncesi): ${formatMoney(rawStampTaxBase)} TL</p>
                            <p>Brüt Asgari Ücret İstisnası: ${formatMoney(stampTaxExemption)} TL</p>
                            <p>Vergilendirilebilir Matrah: ${formatMoney(stampTaxBase)} TL</p>
                            <p>Damga Vergisi Oranı: %${(stampTaxRate * 100).toFixed(3)}</p>
                            <p>Ödenecek Damga Vergisi: ${formatMoney(stampTax)} TL</p>
                        </div>
                    </div>
                    
                    <p><strong>Efektif Vergi Oranı:</strong> %${(effectiveTaxRate * 100).toFixed(2)}</p>
                    <p><small>7194 Sayılı Kanun kapsamında net asgari ücrete tekabül eden gelir vergisi ve brüt asgari ücret tutarındaki damga vergisi istisnaları uygulanmıştır.</small></p>
                </div>
            `;
        }
        
        // Generate period text
        const periodInput = document.getElementById('period').value;
        const periodDate = new Date(periodInput);
        const periodMonth = periodDate.toLocaleString('tr-TR', { month: 'long' });
        const periodYear = periodDate.getFullYear();
        const periodText = `${periodMonth.toUpperCase()} ${periodYear}`;
        
        // Prepare and display results
        const currentDate = new Date().toLocaleDateString('tr-TR');
        
        // KESİNTİLER tablosunu güncelleyelim - asgari ücret istisnalarını gösterelim
        const deductionsTableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Tanım</th>
                        <th>Oran/Açıklama</th>
                        <th>Tutar (TL)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td data-label="Tanım">SGK İşçi Payı</td>
                        <td data-label="Oran/Açıklama">%${(sgkEmployeeRate * 100).toFixed(2)} ${isRetired ? '(Emekli)' : ''}</td>
                        <td data-label="Tutar (TL)">-${formatMoney(sgkEmployeeDeduction)}</td>
                    </tr>
                    ${!isRetired ? `
                    <tr>
                        <td data-label="Tanım">İşsizlik Sigortası İşçi Payı</td>
                        <td data-label="Oran/Açıklama">%${(unemploymentEmployeeRate * 100).toFixed(2)}</td>
                        <td data-label="Tutar (TL)">-${formatMoney(unemploymentEmployeeDeduction)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td data-label="Tanım">Hesaplanan Gelir Vergisi</td>
                        <td data-label="Oran/Açıklama">${useProgressiveTax ? `Kademeli (Efektif: %${(effectiveTaxRate * 100).toFixed(2)})` : `%${(taxRate * 100).toFixed(2)})`}</td>
                        <td data-label="Tutar (TL)">-${formatMoney(rawIncomeTax)}</td>
                    </tr>
                    <tr class="exemption-row">
                        <td data-label="Tanım">Asgari Ücret Gelir Vergisi İstisnası</td>
                        <td data-label="Oran/Açıklama">7194 S.K. (%14-%1 kesintisi ile)</td>
                        <td data-label="Tutar (TL)">+${formatMoney(minimumWageIncomeTax)}</td>
                    </tr>
                    <tr>
                        <td data-label="Tanım">Damga Vergisi</td>
                        <td data-label="Oran/Açıklama">%${(stampTaxRate * 100).toFixed(3)} (Asgari ücrete kadar istisna)</td>
                        <td data-label="Tutar (TL)">-${formatMoney(stampTax)}</td>
                    </tr>
                    <tr>
                        <td data-label="Tanım">Özel Sağlık BE</td>
                        <td data-label="Oran/Açıklama">İade</td>
                        <td data-label="Tutar (TL)">-${formatMoney(healthBenefit)}</td>
                    </tr>
                    ${advance > 0 ? `
                    <tr>
                        <td data-label="Tanım">Avans</td>
                        <td data-label="Oran/Açıklama"></td>
                        <td data-label="Tutar (TL)">-${formatMoney(advance)}</td>
                    </tr>
                    ` : ''}
                    ${unionFeeEnabled ? `
                    <tr>
                        <td data-label="Tanım">Sendika Aidatı</td>
                        <td data-label="Oran/Açıklama">Bir günlük ücret (7.5 saat)</td>
                        <td data-label="Tutar (TL)">-${formatMoney(unionFee)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td colspan="2" data-label="Toplam">TOPLAM KESİNTİLER</td>
                        <td data-label="Tutar (TL)">-${formatMoney(totalDeductions)}</td>
                    </tr>
                </tbody>
            </table>
        `;
        
        // Şablonu güncelleyelim - özel olarak hazırladığımız kesintiler tablosunu kullanarak
        const resultHTML = `
            <div class="company-header">
                <h3>MAAŞ BORDROSU</h3>
                <p>Dönem: ${periodText}</p>
            </div>
            
            <div class="employee-info">
                <p><strong>Adı Soyadı:</strong> ${name}</p>
                <p><strong>Çalışan Durumu:</strong> ${isRetired ? 'Emekli Çalışan' : 'Normal Çalışan'}</p>
                <p><strong>Saat Ücreti:</strong> ${formatMoney(hourlyRate)} TL</p>
                <p><strong>Düzenleme Tarihi:</strong> ${currentDate}</p>
            </div>
            
            <div class="salary-section income-section">
                <h4>GELİRLER</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Tanım</th>
                            <th>Saat / Adet</th>
                            <th>Tutar (TL)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Çalışma saati açıklamasını ekleyelim -->
                        ${effectiveUnpaidLeaveHours > 0 ? `
                        <tr class="info-row">
                            <td data-label="Bilgi" colspan="3">
                                <em>Toplam Çalışma Süresi: ${workHoursAfterUnpaidLeave} saat (${totalWorkingHours} saat - ${effectiveUnpaidLeaveHours} saat ücretsiz izin)</em>
                            </td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td data-label="Tanım">Normal Çalışma</td>
                            <td data-label="Saat / Adet">${actualWorkHours.toFixed(2)} saat (${(actualWorkHours / dailyWorkHours).toFixed(2)} gün)</td>
                            <td data-label="Tutar (TL)">${formatMoney(baseSalary)}</td>
                        </tr>
                        ${annualLeaveHours > 0 ? `
                        <tr>
                            <td data-label="Tanım">Yıllık İzin</td>
                            <td data-label="Saat / Adet">${annualLeaveHours.toFixed(2)} saat (${(annualLeaveHours / dailyWorkHours).toFixed(2)} gün)</td>
                            <td data-label="Tutar (TL)">${formatMoney(annualLeavePay)}</td>
                        </tr>
                        ` : ''}
                        ${weekendHours > 0 ? `
                        <tr>
                            <td data-label="Tanım">Hafta Sonu Çalışma</td>
                            <td data-label="Saat / Adet">${weekendHours.toFixed(2)} saat (${(weekendHours / dailyWorkHours).toFixed(2)} gün)</td>
                            <td data-label="Tutar (TL)">${formatMoney(weekendPay)}</td>
                        </tr>
                        ` : ''}
                        <!-- Toplam Çalışma Saati Kontrolü - Bu satırı ekleyelim -->
                        <tr class="subtotal-row">
                            <td data-label="Toplam">Esas Çalışma Saatleri</td>
                            <td data-label="Toplam Saat">${(actualWorkHours + annualLeaveHours + weekendHours).toFixed(2)} saat</td>
                            <td data-label="Tutar (TL)">${formatMoney(baseSalary + annualLeavePay + weekendPay)}</td>
                        </tr>
                        
                        <!-- Diğer Gelir Kalemleri - Burada Eksik Olanları Ekleyelim -->
                        ${overtime > 0 ? `
                        <tr>
                            <td data-label="Tanım">Fazla Mesai (2x)</td>
                            <td data-label="Saat / Adet">${overtime.toFixed(2)} saat</td>
                            <td data-label="Tutar (TL)">${formatMoney(overtimePay)}</td>
                        </tr>
                        ` : ''}
                        ${nightShiftHours > 0 ? `
                        <tr>
                            <td data-label="Tanım">Gece Çalışma Tazminatı</td>
                            <td data-label="Saat / Adet">${nightShiftHours.toFixed(2)} saat</td>
                            <td data-label="Tutar (TL)">${formatMoney(nightShiftPay)}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td data-label="Tanım">İkramiye</td>
                            <td data-label="Saat / Adet">${bonusHours} saat</td>
                            <td data-label="Tutar (TL)">${formatMoney(bonusPay)}</td>
                        </tr>
                        ${childCount > 0 ? `
                        <tr>
                            <td data-label="Tanım">Çocuk Yardımı</td>
                            <td data-label="Saat / Adet">${childCount} çocuk</td>
                            <td data-label="Tutar (TL)">${formatMoney(childSupportTotal)}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td data-label="Tanım">Yakacak Yardımı</td>
                            <td data-label="Saat / Adet"></td>
                            <td data-label="Tutar (TL)">${formatMoney(heatingAllowance)}</td>
                        </tr>
                        <tr>
                            <td data-label="Tanım">Özel Sağlık BE</td>
                            <td data-label="Saat / Adet"></td>
                            <td data-label="Tutar (TL)">${formatMoney(healthBenefit)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="2" data-label="Toplam">TOPLAM BRÜT GELİR</td>
                            <td data-label="Tutar (TL)">${formatMoney(monthlyGrossIncome)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="salary-section deduction-section">
                <h4>KESİNTİLER</h4>
                ${deductionsTableHTML}
                ${taxBreakdownHTML}
            </div>
            
            <div class="salary-section summary-section">
                <h4>ÖZET</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Tanım</th>
                            <th>Tutar (TL)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td data-label="Tanım">Toplam Brüt Gelir</td>
                            <td data-label="Tutar (TL)">${formatMoney(monthlyGrossIncome)}</td>
                        </tr>
                        <tr>
                            <td data-label="Tanım">Toplam Kesintiler</td>
                            <td data-label="Tutar (TL)">-${formatMoney(totalDeductions)}</td>
                        </tr>
                        <tr class="grand-total">
                            <td data-label="Tanım"><strong>NET ÖDENEN</strong></td>
                            <td data-label="Tutar (TL)"><strong>${formatMoney(netSalary)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="absence-section">
                <h4>DEVAMSIZLIK VE İZİN BİLGİLERİ</h4>
                <table>
                    <thead>
                        <tr>
                            <th>İzin Türü</th>
                            <th>Saat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${annualLeaveHours > 0 ? `
                        <tr>
                            <td data-label="İzin Türü">Yıllık İzin</td>
                            <td data-label="Saat">${annualLeaveHours} saat (${(annualLeaveHours / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        ` : ''}
                        ${unpaidLeaveHours > 0 ? `
                        <tr>
                            <td data-label="İzin Türü">Ücretsiz İzin</td>
                            <td data-label="Saat">${unpaidLeaveHours} saat (${(unpaidLeaveHours / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        ` : ''}
                        ${effectiveUnpaidLeaveHours > unpaidLeaveHours ? `
                        <tr>
                            <td data-label="İzin Türü">Toplam Ücretsiz İzin Etkisi</td>
                            <td data-label="Saat">${effectiveUnpaidLeaveHours} saat (${(effectiveUnpaidLeaveHours / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        <tr>
                            <td data-label="İzin Türü">Çalışılan Saat</td>
                            <td data-label="Saat">${workHoursAfterUnpaidLeave} saat (${(workHoursAfterUnpaidLeave / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        ` : effectiveUnpaidLeaveHours > 0 ? `
                        <tr>
                            <td data-label="İzin Türü">Çalışılan Saat</td>
                            <td data-label="Saat">${workHoursAfterUnpaidLeave} saat (${(workHoursAfterUnpaidLeave / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        ` : ''}
                        ${!isRetired && absenceHours > 0 ? `
                        <tr>
                            <td data-label="İzin Türü">Devamsızlık</td>
                            <td data-label="Saat">${absenceHours} saat (${(absenceHours / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        ` : ''}
                        ${!isRetired && sickLeaveHours > 0 ? `
                        <tr>
                            <td data-label="İzin Türü">Raporlu / Hastalık İzni</td>
                            <td data-label="Saat">${sickLeaveHours} saat (${(sickLeaveHours / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        ` : ''}
                        ${isRetired && (absenceHours > 0 || sickLeaveHours > 0) ? `
                        <tr>
                            <td data-label="İzin Türü">Devamsızlık+Rapor (Ücretsiz İzin)</td>
                            <td data-label="Saat">${absenceHours + sickLeaveHours} saat (${((absenceHours + sickLeaveHours) / dailyWorkHours).toFixed(1)} gün)</td>
                        </tr>
                        <tr>
                            <td colspan="2" data-label="Not"><em>Not: Emekli çalışanlarda yıllık izin dışındaki tüm devamsızlıklar ücretsiz izin olarak hesaplanmıştır.</em></td>
                        </tr>
                        ` : ''}
                        ${(annualLeaveHours === 0 && unpaidLeaveHours === 0 && absenceHours === 0 && sickLeaveHours === 0) ? `
                        <tr>
                            <td colspan="2" data-label="Bilgi">Bu ay için kaydedilmiş izin/devamsızlık bilgisi bulunmamaktadır.</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
            
            <div class="signatures">
                <p>Bu bordro bilgileri tahmini değerlerdir. Resmi bordronuzda farklılıklar olabilir.</p>
                <p>Tarih: ${currentDate}</p>
            </div>
        `;
        
        resultContent.innerHTML = resultHTML;
        result.classList.remove('hidden');
    }
    
    // Helper function to format bracket names
    function getBracketName(bracketIndex) {
        switch(bracketIndex) {
            case 0: return "1. dilim (%15)";
            case 1: return "2. dilim (%20)";
            case 2: return "3. dilim (%27)";
            case 3: return "4. dilim (%35)";
            case 4: return "5. dilim (%40)";
            default: return "1. dilim (%15)";
        }
    }
});
