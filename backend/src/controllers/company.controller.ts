import { Request, Response } from 'express';
import * as companyService from '../services/company.service';

export const list = async (req: Request, res: Response) => {
    try {
        const companies = await companyService.getAllCompanies();
        res.json(companies);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getById = async (req: Request, res: Response) => {
    try {
        const company = await companyService.getCompanyById(req.params.id);
        if (!company) return res.status(404).json({ error: 'Company not found' });
        res.json(company);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const result = await companyService.updateCompanyStatus(req.params.id, status);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const result = await companyService.createCompany(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const stats = async (req: Request, res: Response) => {
    try {
        const stats = await companyService.getPlatformStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const superAdminDashboard = async (req: Request, res: Response) => {
    try {
        const dashboard = await companyService.getSuperAdminDashboard();
        res.json(dashboard);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

