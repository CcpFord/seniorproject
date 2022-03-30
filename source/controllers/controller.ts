import { Request, Response, NextFunction } from 'express';
import SolrNode from 'solr-node';
import service from '../services/service';

const config = require('../../config');

class ControllerClass {
    
    public static getBrowseBookByPage = async (req: Request, res: Response, next: NextFunction) => {
        const { params } = req;
        const page: number = parseInt(params.page);
        const client = new SolrNode(config.tribuddhaTH);
        const bookQuery = client.query().q({book_id:parseInt(params.id)}).rows(config.defaultListBrowsePage).start((page - 1) * config.defaultListBrowsePage);
        const result = await client.search(bookQuery);
        return res.status(200).json({
            page: page,
            lastPage: Math.ceil(result.response.numFound / config.defaultListBrowsePage),
            data: result.response
        });
    }
    
    public static getSearchBookByFilterPage = async (req:Request, res: Response, next: NextFunction) => {
        const { page, filter } = req.body;
        const client = new SolrNode(config.tribuddhaTH);
        let bookQuery = client.query().rows(config.defaultListSearchPage).start((page - 1) * config.defaultListSearchPage).qop("AND");

        await service.setFilter(bookQuery, filter);

        const result = await client.search(bookQuery);
        return res.status(200).json({
            lastPage: Math.ceil(result.response.numFound / config.defaultListBrowsePage),
            data: result.response,
            header: result.responseHeader
        });
    
    }
    
    public static getSearchBookTextByFilterPage = async (req:Request, res: Response, next: NextFunction) => {
        const { startIndex, filter } = req.body;
        const client = new SolrNode(config.tribuddhaTH);
        const bookQuery = client.query().rows(1).start(startIndex);
        const currentBook = client.query().rows(config.defaultListBrowsePage);
    
        await service.setFilter(bookQuery, filter);
        
        const resultRaw = await client.search(bookQuery);
    
        const resultJson = JSON.parse(JSON.stringify(resultRaw.response.docs[0])); 
        currentBook.q({book_id: resultJson.book_id[0]}).start(Math.ceil(resultJson.morality_num[0] / config.defaultListBrowsePage) - 1);    
        const result = await client.search(currentBook);
        return res.status(200).json({
            data: result.response
        });
    }
    
    public static getCompareBookByFilter = async (req:Request, res: Response, next: NextFunction) => {
        const { bookId, bookType, moralityNumber } = req.body;
        let client;
        let queryJson: {[key: string]: any} = {book_id: bookId};
        
        if (bookType === 'TH') {
            client = new SolrNode(config.tribuddhaTH);
        } else {
            client = new SolrNode(config.tribuddhaPali);
        }
        const lastRecordQuery = client.query().q({book_id: bookId}).sort({morality_num: "desc"}).start(0).rows(1);
        const lastRecordRaw = await client.search(lastRecordQuery);
        const lastRecord = JSON.parse(JSON.stringify(lastRecordRaw.response.docs[0]));
        const bookQuery = client.query().qop("AND").sort({morality_num: "asc"});
    
        if (moralityNumber === 1) {
            queryJson["morality_num"] = `(${moralityNumber} OR ${moralityNumber + 1} OR ${moralityNumber + 2})`;
        } else if (moralityNumber === lastRecord.morality_num[0]) {
            queryJson["morality_num"] = `(${moralityNumber} OR ${moralityNumber - 1} OR ${moralityNumber - 2})`;
        } else {
            queryJson["morality_num"] = `(${moralityNumber} OR ${moralityNumber - 1} OR ${moralityNumber + 1})`;
        }
        bookQuery.q(queryJson);
        const result = await client.search(bookQuery);
    
        return res.status(200).json({
            data: result.response,
        });
    }

    public static getAllBook = async (req: Request, res: Response, next: NextFunction) => {
        const { params } = req;
        let client;
        client = (params.bookType === 'TH') ? new SolrNode(config.tribuddhaTH) : new SolrNode(config.tribuddhaPali);
        const bookQuery = client.query().q({book_id: '*'}).facetQuery("facet=true&facet.field=book_id&facet.sort='index'");
        const resultFacet = JSON.parse(JSON.stringify(await client.search(bookQuery)));
        const bookIds = resultFacet.facet_counts.facet_fields.book_id.filter((value: any) => {
            return typeof value === 'string';
        });

        let bookDetails: {[key: string]: any}[] = [];
        for(const bookId of bookIds) {
            const bookDetail = client.query().q({book_id: parseInt(bookId)}).rows(1).fl("book_id, category, title");
            const bookDetailResualt = await client.search(bookDetail);
            console.log(JSON.parse(JSON.stringify(bookDetailResualt.response.docs[0])));
            bookDetails.push(bookDetailResualt.response.docs[0]);
        }
        return res.status(200).json({
            data: bookDetails
        });
    }
}
export default ControllerClass;