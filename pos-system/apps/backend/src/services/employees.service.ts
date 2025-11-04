import { EmployeesRepository } from '../repos/employees.repo';
import { EmployeeRole } from '../types/local';

// Function to generate a random 4-digit login code
function generateLoginCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export class EmployeesService {
  constructor(private employeesRepo: EmployeesRepository) {}

  async getEmployees() {
    return this.employeesRepo.findAll();
  }

  async getAllEmployees() {
    return this.employeesRepo.findAllIncludingInactive();
  }

  async getDrivers() {
    return this.employeesRepo.findByRole(EmployeeRole.DRIVER);
  }

  async getEmployeeById(id: string) {
    const employee = await this.employeesRepo.findById(id);
    if (!employee) {
      throw new Error(`Pracownik o ID ${id} nie został znaleziony`);
    }
    return employee;
  }

  async getEmployeeByLoginCode(loginCode: string) {
    console.log('🔍 Searching for employee with loginCode:', loginCode);
    let employee = await this.employeesRepo.findByLoginCode(loginCode);
    
    if (!employee) {
      console.error('❌ Employee not found for loginCode:', loginCode);
      // Log all employees with loginCode for debugging
      const allEmployees = await this.employeesRepo.findAll();
      const employeesWithCodes = allEmployees.filter(emp => emp.loginCode);
      console.log('📋 Employees with loginCode in database:', employeesWithCodes.map(emp => ({
        id: emp.id,
        name: emp.name,
        loginCode: emp.loginCode,
        role: emp.role,
        isActive: emp.isActive
      })));
      
      // AUTOMATIC FIX: Try to find employee by matching existing loginCode pattern
      // If no employee found, check if there are employees without loginCode
      const employeesWithoutCode = allEmployees.filter(emp => !emp.loginCode || emp.loginCode === null);
      console.log('📋 Employees WITHOUT loginCode:', employeesWithoutCode.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        isActive: emp.isActive
      })));
      
      throw new Error(`Pracownik z kodem logowania ${loginCode} nie został znaleziony. Ustaw loginCode dla pracowników w POS System.`);
    }
    
    if (!employee.isActive) {
      console.error('❌ Employee found but is inactive:', employee.id);
      throw new Error(`Konto pracownika jest nieaktywne`);
    }
    
    console.log('✅ Employee found and active:', employee.name, employee.loginCode);
    return employee;
  }
  
  async getEmployeeByEmail(email: string) {
    console.log('🔍 Searching for employee with email:', email);
    const employee = await this.employeesRepo.findByEmail(email);
    
    if (!employee) {
      console.error('❌ Employee not found for email:', email);
      throw new Error(`Pracownik z emailem ${email} nie został znaleziony`);
    }
    
    if (!employee.isActive) {
      console.error('❌ Employee found but is inactive:', employee.id);
      throw new Error(`Konto pracownika jest nieaktywne`);
    }
    
    console.log('✅ Employee found and active:', employee.name, employee.email);
    return employee;
  }
  
  // Helper method to ensure all active employees have loginCode
  async ensureAllEmployeesHaveLoginCode() {
    const allEmployees = await this.employeesRepo.findAll();
    const employeesWithoutCode = allEmployees.filter(emp => !emp.loginCode || emp.loginCode === null);
    
    if (employeesWithoutCode.length === 0) {
      console.log('✅ All employees have loginCode');
      return { generated: 0, total: allEmployees.length };
    }
    
    console.log(`🔧 Generating loginCode for ${employeesWithoutCode.length} employees without code...`);
    let generated = 0;
    
    for (const emp of employeesWithoutCode) {
      const newLoginCode = this.generateUniqueLoginCode(allEmployees);
      await this.employeesRepo.update(emp.id, { loginCode: newLoginCode });
      console.log(`✅ Generated loginCode ${newLoginCode} for ${emp.name}`);
      generated++;
      allEmployees.push({ ...emp, loginCode: newLoginCode });
    }
    
    return { generated, total: allEmployees.length };
  }
  
  private generateUniqueLoginCode(existingEmployees: any[]): string {
    const existingCodes = existingEmployees
      .map(emp => emp.loginCode)
      .filter(code => code && /^\d{4}$/.test(code));
    
    let newCode: string;
    do {
      newCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit number
    } while (existingCodes.includes(newCode));
    
    return newCode;
  }

  async createEmployee(data: {
    name: string;
    email: string;
    phone?: string;
    role: EmployeeRole;
    loginCode?: string;
  }) {
    // Validate email uniqueness (check all employees, including inactive)
    const existingEmployee = await this.employeesRepo.findAllIncludingInactive();
    if (existingEmployee.some((emp: any) => emp.email === data.email)) {
      throw new Error('Pracownik z tym adresem email już istnieje');
    }

    // Generate login code if not provided
    const employeeData = {
      ...data,
      loginCode: data.loginCode || generateLoginCode()
    };

    // Ensure login code uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const existingWithCode = await this.employeesRepo.findByLoginCode(employeeData.loginCode!);
      if (!existingWithCode) {
        break;
      }
      employeeData.loginCode = generateLoginCode();
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error('Nie można wygenerować unikalnego kodu logowania');
    }

    return this.employeesRepo.create(employeeData);
  }

  async updateEmployee(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: EmployeeRole;
    loginCode?: string;
    isActive?: boolean;
  }) {
    const employee = await this.employeesRepo.findById(id);
    if (!employee) {
      throw new Error(`Pracownik o ID ${id} nie został znaleziony`);
    }

    // Validate email uniqueness if email is being updated
    if (data.email && data.email !== employee.email) {
      const existingEmployees = await this.employeesRepo.findAll();
      if (existingEmployees.some((emp: any) => emp.email === data.email && emp.id !== id)) {
        throw new Error('Pracownik z tym adresem email już istnieje');
      }
    }

    // Validate login code uniqueness if login code is being updated
    if (data.loginCode && data.loginCode !== employee.loginCode) {
      const existingWithCode = await this.employeesRepo.findByLoginCode(data.loginCode);
      if (existingWithCode && existingWithCode.id !== id) {
        throw new Error('Pracownik z tym kodem logowania już istnieje');
      }
    }

    return this.employeesRepo.update(id, data);
  }

  async deleteEmployee(id: string) {
    const employee = await this.employeesRepo.findById(id);
    if (!employee) {
      throw new Error(`Pracownik o ID ${id} nie został znaleziony`);
    }

    return this.employeesRepo.delete(id);
  }

  async generateNewLoginCode(id: string) {
    const employee = await this.employeesRepo.findById(id);
    if (!employee) {
      throw new Error(`Pracownik o ID ${id} nie został znaleziony`);
    }

    // Generate new unique login code
    let newLoginCode = generateLoginCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const existingWithCode = await this.employeesRepo.findByLoginCode(newLoginCode);
      if (!existingWithCode) {
        break;
      }
      newLoginCode = generateLoginCode();
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error('Nie można wygenerować unikalnego kodu logowania');
    }

    return this.employeesRepo.update(id, { loginCode: newLoginCode });
  }

  async updateLoginCode(id: string, loginCode: string) {
    const employee = await this.employeesRepo.findById(id);
    if (!employee) {
      throw new Error(`Pracownik o ID ${id} nie został znaleziony`);
    }

    // Validate login code format
    if (!/^\d{4}$/.test(loginCode)) {
      throw new Error('Kod logowania musi składać się z dokładnie 4 cyfr');
    }

    // Check if code is already used by another employee
    const existingWithCode = await this.employeesRepo.findByLoginCode(loginCode);
    if (existingWithCode && existingWithCode.id !== id) {
      throw new Error('Ten kod logowania jest już używany przez innego pracownika');
    }

    return this.employeesRepo.update(id, { loginCode });
  }

  async updateDriverLocation(driverId: string, latitude: number, longitude: number, orderId?: string) {
    // Store location in database
    const location = await this.employeesRepo.updateDriverLocation(driverId, latitude, longitude, orderId);
    
    console.log(`📍 Driver ${driverId} location update:`, {
      latitude,
      longitude,
      orderId,
      timestamp: new Date().toISOString()
    });

    return location;
  }

  async deactivateDriverLocation(driverId: string) {
    return this.employeesRepo.deactivateDriverLocation(driverId);
  }

  async getActiveDriverLocations() {
    return this.employeesRepo.getActiveDriverLocations();
  }
}
