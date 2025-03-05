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
        let remainingIncome = monthlyIncome;
        let currentTaxDetails = [];
        let hasMultipleBrackets = false;
        
        // Starting position based on previous income
        let currentTaxBracketIndex = 0;
        let incomeInCurrentBracket = previousIncome;
        
        // Find which tax bracket the previous income falls into
        for (let i = 0; i < taxBrackets.length; i++) {
            if (previousIncome < taxBrackets[i].limit) {
                currentTaxBracketIndex = i;
                incomeInCurrentBracket = previousIncome;
                break;
            } else {
                incomeInCurrentBracket = previousIncome - (i > 0 ? taxBrackets[i-1].limit : 0);
            }
        }
        
        // Add the remaining income to each bracket as necessary
        let totalProcessedIncome = 0;
        while (remainingIncome > 0 && currentTaxBracketIndex < taxBrackets.length) {
            const bracket = taxBrackets[currentTaxBracketIndex];
            const prevLimit = currentTaxBracketIndex > 0 ? taxBrackets[currentTaxBracketIndex - 1].limit : 0;
            const bracketCapacity = bracket.limit - prevLimit;
            const availableInBracket = bracketCapacity - incomeInCurrentBracket;
            
            const taxableInThisBracket = Math.min(remainingIncome, availableInBracket);
            const taxForThisBracket = taxableInThisBracket * bracket.rate;
            
            if (taxableInThisBracket > 0) {
                currentTaxDetails.push({
                    bracket: currentTaxBracketIndex,
                    rate: bracket.rate,
                    income: taxableInThisBracket,
                    tax: taxForThisBracket,
                    bracketStart: prevLimit,
                    bracketEnd: bracket.limit
                });
            }
            
            totalTax += taxForThisBracket;
            totalProcessedIncome += taxableInThisBracket;
            remainingIncome -= taxableInThisBracket;
            
            // Move to next bracket
            currentTaxBracketIndex++;
            incomeInCurrentBracket = 0;
            
            // Check if there are multiple brackets
            if (remainingIncome > 0 && currentTaxBracketIndex < taxBrackets.length) {
                hasMultipleBrackets = true;
            }
        }
        
        // Calculate effective tax rate
        const effectiveTaxRate = totalTax / monthlyIncome;
        
        return {
            totalTax, 
            effectiveTaxRate,
            taxDetails: currentTaxDetails,
            hasMultipleBrackets
        };
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
        
        // Get absence information
        const annualLeave = parseFloat(document.getElementById('annualLeave').value) || 0;
        const unpaidLeave = parseFloat(document.getElementById('unpaidLeave').value) || 0;
        const absence = parseFloat(document.getElementById('absence').value) || 0;
        const sickLeave = parseFloat(document.getElementById('sickLeave').value) || 0;
        
        // For retired employees, all absences (except annual leave) are counted as unpaid leave
        let effectiveUnpaidLeave = unpaidLeave;
        if (isRetired) {
            effectiveUnpaidLeave = unpaidLeave + absence + sickLeave;
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
        
        // Calculate total working hours (from days)
        // We need to subtract unpaid leave directly from working days
        const workDaysAfterUnpaidLeave = Math.max(0, workDays - effectiveUnpaidLeave);
        const totalWorkHours = workDaysAfterUnpaidLeave * dailyWorkHours;
        
        // Calculate annual leave hours
        const annualLeaveHours = annualLeave * dailyWorkHours;
        
        // Actual hours worked - now simply totalWorkHours without annual leave hours
        const actualWorkHours = totalWorkHours - annualLeaveHours;
        
        // Calculate annual leave pay (full pay for annual leave days)
        const annualLeavePay = annualLeaveHours * hourlyRate;
        
        // Calculate income components
        const baseSalary = actualWorkHours * hourlyRate;
        const weekendPay = weekendHours * hourlyRate; // Regular rate for weekend hours
        const overtimePay = overtime * hourlyRate * 2; // Double rate for overtime
        const nightShiftPay = nightShiftHours * hourlyRate * 0.1; // 10% of hourly rate for night shift
        const bonusPay = bonusHours * hourlyRate; // Regular hourly rate for bonus hours
        
        // Calculate standard allowances
        const childSupportPerChild = 250; // TL per child, example value
        const childSupportTotal = childCount * childSupportPerChild;
        
        // Calculate gross income - now using the fixed heating allowance
        const monthlyGrossIncome = baseSalary + weekendPay + overtimePay + nightShiftPay + 
                              bonusPay + annualLeavePay + childSupportTotal + 
                              heatingAllowance + healthBenefit;
        
        // Calculate union fee - one day's wages
        let unionFee = 0;
        if (unionFeeEnabled) {
            unionFee = hourlyRate * dailyWorkHours; // One day's wages
        }
        
        // Calculate standard deductions
        const sgkEmployeeDeduction = monthlyGrossIncome * sgkEmployeeRate;
        const unemploymentEmployeeDeduction = monthlyGrossIncome * unemploymentEmployeeRate;
        const stampTax = monthlyGrossIncome * stampTaxRate;
        
        // Calculate the tax base (matrah) by subtracting SGK and unemployment insurance
        const taxBase = monthlyGrossIncome - sgkEmployeeDeduction - unemploymentEmployeeDeduction;
        
        // Calculate tax
        let incomeTax = 0;
        let taxDetails = null;
        let effectiveTaxRate = taxRate;
        
        if (useProgressiveTax) {
            // Calculate progressive tax based on the tax base
            const taxCalculation = calculateProgressiveTax(taxBase, cumulativeIncome);
            incomeTax = taxCalculation.totalTax;
            taxDetails = taxCalculation.taxDetails;
            effectiveTaxRate = taxCalculation.effectiveTaxRate;
        } else {
            // Fixed tax rate as selected in the form
            incomeTax = taxBase * taxRate;
        }
        
        // Calculate total deductions
        const totalDeductions = sgkEmployeeDeduction + unemploymentEmployeeDeduction + 
                             incomeTax + stampTax + advance + unionFee + healthBenefit;
        
        // Calculate net salary
        const netSalary = monthlyGrossIncome - totalDeductions;
        
        // Generate tax breakdown HTML if we're using progressive tax
        let taxBreakdownHTML = '';
        if (useProgressiveTax && taxDetails && taxDetails.length > 0) {
            // Calculate which tax bracket the employee will be in next month
            const totalCumulativeIncomeAfterThisMonth = cumulativeIncome + taxBase;
            let nextMonthBracket = "1. dilim (%15)";
            let nextMonthBracketRate = 15;
            let nextBracketIndex = 0; // Track current bracket index
            
            // Determine which tax bracket they'll be in next month
            if (totalCumulativeIncomeAfterThisMonth >= taxBrackets[3].limit) {
                nextMonthBracket = "5. dilim (%40)";
                nextMonthBracketRate = 40;
                nextBracketIndex = 4; // Last bracket
            } else if (totalCumulativeIncomeAfterThisMonth >= taxBrackets[2].limit) {
                nextMonthBracket = "4. dilim (%35)";
                nextMonthBracketRate = 35;
                nextBracketIndex = 3;
            } else if (totalCumulativeIncomeAfterThisMonth >= taxBrackets[1].limit) {
                nextMonthBracket = "3. dilim (%27)";
                nextMonthBracketRate = 27;
                nextBracketIndex = 2;
            } else if (totalCumulativeIncomeAfterThisMonth >= taxBrackets[0].limit) {
                nextMonthBracket = "2. dilim (%20)";
                nextMonthBracketRate = 20;
                nextBracketIndex = 1;
            } else {
                nextBracketIndex = 0;
            }
            
            // Calculate how much more income until the next tax bracket (if not already at highest)
            let nextBracketInfo = "";
            if (nextBracketIndex < 4) { // If not in the highest bracket
                // Get the NEXT bracket's threshold and rate
                const nextBracketThreshold = taxBrackets[nextBracketIndex].limit;
                const nextBracketRate = taxBrackets[nextBracketIndex + 1].rate;
                const amountUntilNextBracket = nextBracketThreshold - totalCumulativeIncomeAfterThisMonth;
                const nextBracketRatePercent = (nextBracketRate * 100).toFixed(0);
                
                nextBracketInfo = `<p>Bir sonraki vergi dilimine (${nextBracketRatePercent}%) girmek için kalan matrah: <strong>${formatMoney(amountUntilNextBracket)} TL</strong></p>`;
            }
            
            taxBreakdownHTML = `
                <div class="tax-details">
                    <h4>Gelir Vergisi Hesabı</h4>
                    <p>Bu ayki brüt geliriniz: ${formatMoney(monthlyGrossIncome)} TL</p>
                    <p>SGK İşçi Payı: -${formatMoney(sgkEmployeeDeduction)} TL</p>
                    <p>İşsizlik Sigortası İşçi Payı: -${formatMoney(unemploymentEmployeeDeduction)} TL</p>
                    <p><strong>Gelir Vergisi Matrahı:</strong> ${formatMoney(taxBase)} TL</p>
                    <p>Yıl içi toplam vergi matrahı (önceki aylar): ${formatMoney(cumulativeIncome)} TL</p>
                    <p>Bu ayın sonundaki toplam vergi matrahı: ${formatMoney(cumulativeIncome + taxBase)} TL</p>
                    <p><strong>Gelecek ay başlangıcındaki vergi diliminiz:</strong> ${nextMonthBracket}</p>
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
                            ${taxDetails.map((detail, index) => `
                                <tr>
                                    <td>${formatMoney(detail.bracketStart)} TL - ${detail.bracketEnd === Infinity ? 'Üzeri' : formatMoney(detail.bracketEnd) + ' TL'}</td>
                                    <td>%${(detail.rate * 100).toFixed(0)}</td>
                                    <td>${formatMoney(detail.income)}</td>
                                    <td>${formatMoney(detail.tax)}</td>
                                </tr>
                            `).join('')}
                            <tr class="summary-row">
                                <td colspan="3"><strong>Toplam Gelir Vergisi</strong></td>
                                <td><strong>${formatMoney(incomeTax)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    <p><strong>Efektif Vergi Oranı:</strong> %${(effectiveTaxRate * 100).toFixed(2)}</p>
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
                    <tr>
                        <th>Tanım</th>
                        <th>Gün / Saat / Adet</th>
                        <th>Tutar (TL)</th>
                    </tr>
                    <tr>
                        <td>Normal Çalışma</td>
                        <td>${(actualWorkHours / dailyWorkHours).toFixed(2)} gün (${actualWorkHours.toFixed(2)} saat)</td>
                        <td>${formatMoney(baseSalary)}</td>
                    </tr>
                    ${annualLeave > 0 ? `
                    <tr>
                        <td>Yıllık İzin</td>
                        <td>${annualLeave.toFixed(2)} gün (${annualLeaveHours.toFixed(2)} saat)</td>
                        <td>${formatMoney(annualLeavePay)}</td>
                    </tr>
                    ` : ''}
                    ${weekendHours > 0 ? `
                    <tr>
                        <td>Hafta Sonu Çalışma</td>
                        <td>${weekendHours.toFixed(2)} saat</td>
                        <td>${formatMoney(weekendPay)}</td>
                    </tr>
                    ` : ''}
                    ${overtime > 0 ? `
                    <tr>
                        <td>Fazla Mesai (2x)</td>
                        <td>${overtime.toFixed(2)} saat</td>
                        <td>${formatMoney(overtimePay)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td>Gece Çalışma Tazminatı</td>
                        <td>${nightShiftHours.toFixed(2)} saat</td>
                        <td>${formatMoney(nightShiftPay)}</td>
                    </tr>
                    <tr>
                        <td>İkramiye</td>
                        <td>${bonusHours} saat</td>
                        <td>${formatMoney(bonusPay)}</td>
                    </tr>
                    ${childCount > 0 ? `
                    <tr>
                        <td>Çocuk Yardımı</td>
                        <td>${childCount} çocuk</td>
                        <td>${formatMoney(childSupportTotal)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td>Yakacak Yardımı</td>
                        <td></td>
                        <td>${formatMoney(heatingAllowance)}</td>
                    </tr>
                    <tr>
                        <td>Özel Sağlık BE</td>
                        <td></td>
                        <td>${formatMoney(healthBenefit)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="2">TOPLAM BRÜT GELİR</td>
                        <td>${formatMoney(monthlyGrossIncome)}</td>
                    </tr>
                </table>
            </div>
            
            <div class="salary-section deduction-section">
                <h4>KESİNTİLER</h4>
                <table>
                    <tr>
                        <th>Tanım</th>
                        <th>Oran/Açıklama</th>
                        <th>Tutar (TL)</th>
                    </tr>
                    <tr>
                        <td>SGK İşçi Payı</td>
                        <td>%${(sgkEmployeeRate * 100).toFixed(2)} ${isRetired ? '(Emekli)' : ''}</td>
                        <td>-${formatMoney(sgkEmployeeDeduction)}</td>
                    </tr>
                    ${!isRetired ? `
                    <tr>
                        <td>İşsizlik Sigortası İşçi Payı</td>
                        <td>%${(unemploymentEmployeeRate * 100).toFixed(2)}</td>
                        <td>-${formatMoney(unemploymentEmployeeDeduction)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td>Gelir Vergisi</td>
                        <td>${useProgressiveTax ? `Kademeli (Efektif: %${(effectiveTaxRate * 100).toFixed(2)})` : `%${(taxRate * 100).toFixed(2)}`}</td>
                        <td>-${formatMoney(incomeTax)}</td>
                    </tr>
                    <tr>
                        <td>Damga Vergisi</td>
                        <td>%${(stampTaxRate * 100).toFixed(3)}</td>
                        <td>-${formatMoney(stampTax)}</td>
                    </tr>
                    <tr>
                        <td>Özel Sağlık BE</td>
                        <td>İade</td>
                        <td>-${formatMoney(healthBenefit)}</td>
                    </tr>
                    ${advance > 0 ? `
                    <tr>
                        <td>Avans</td>
                        <td></td>
                        <td>-${formatMoney(advance)}</td>
                    </tr>
                    ` : ''}
                    ${unionFeeEnabled ? `
                    <tr>
                        <td>Sendika Aidatı</td>
                        <td>Bir günlük ücret (7.5 saat)</td>
                        <td>-${formatMoney(unionFee)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td colspan="2">TOPLAM KESİNTİLER</td>
                        <td>-${formatMoney(totalDeductions)}</td>
                    </tr>
                </table>
                
                ${taxBreakdownHTML}
            </div>
            
            <div class="salary-section summary-section">
                <h4>ÖZET</h4>
                <table>
                    <tr>
                        <th>Tanım</th>
                        <th>Tutar (TL)</th>
                    </tr>
                    <tr>
                        <td>Toplam Brüt Gelir</td>
                        <td>${formatMoney(monthlyGrossIncome)}</td>
                    </tr>
                    <tr>
                        <td>Toplam Kesintiler</td>
                        <td>-${formatMoney(totalDeductions)}</td>
                    </tr>
                    <tr class="grand-total">
                        <td><strong>NET ÖDENEN</strong></td>
                        <td><strong>${formatMoney(netSalary)}</strong></td>
                    </tr>
                </table>
            </div>
            
            <div class="absence-section">
                <h4>DEVAMSIZLIK VE İZİN BİLGİLERİ</h4>
                <table>
                    <tr>
                        <th>İzin Türü</th>
                        <th>Gün</th>
                    </tr>
                    ${annualLeave > 0 ? `
                    <tr>
                        <td>Yıllık İzin</td>
                        <td>${annualLeave}</td>
                    </tr>
                    ` : ''}
                    ${unpaidLeave > 0 ? `
                    <tr>
                        <td>Ücretsiz İzin</td>
                        <td>${unpaidLeave}</td>
                    </tr>
                    ` : ''}
                    ${effectiveUnpaidLeave > unpaidLeave ? `
                    <tr>
                        <td>Toplam Ücretsiz İzin Etkisi</td>
                        <td>${effectiveUnpaidLeave}</td>
                    </tr>
                    <tr>
                        <td>Çalışılan Gün</td>
                        <td>${workDaysAfterUnpaidLeave} (${workDays} - ${effectiveUnpaidLeave})</td>
                    </tr>
                    ` : effectiveUnpaidLeave > 0 ? `
                    <tr>
                        <td>Çalışılan Gün</td>
                        <td>${workDaysAfterUnpaidLeave} (${workDays} - ${effectiveUnpaidLeave})</td>
                    </tr>
                    ` : ''}
                    ${!isRetired && absence > 0 ? `
                    <tr>
                        <td>Devamsızlık</td>
                        <td>${absence}</td>
                    </tr>
                    ` : ''}
                    ${!isRetired && sickLeave > 0 ? `
                    <tr>
                        <td>Raporlu / Hastalık İzni</td>
                        <td>${sickLeave}</td>
                    </tr>
                    ` : ''}
                    ${isRetired && (absence > 0 || sickLeave > 0) ? `
                    <tr>
                        <td>Devamsızlık+Rapor (Ücretsiz İzin)</td>
                        <td>${absence + sickLeave}</td>
                    </tr>
                    <tr>
                        <td colspan="2"><em>Not: Emekli çalışanlarda yıllık izin dışındaki tüm devamsızlıklar ücretsiz izin olarak hesaplanmıştır.</em></td>
                    </tr>
                    ` : ''}
                    ${(annualLeave === 0 && unpaidLeave === 0 && absence === 0 && sickLeave === 0) ? `
                    <tr>
                        <td colspan="2">Bu ay için kaydedilmiş izin/devamsızlık bilgisi bulunmamaktadır.</td>
                    </tr>
                    ` : ''}
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
});
