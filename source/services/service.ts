import SolrNode from 'solr-node';

class Service {

    public static setFilter = (
        bookQuery: SolrNode.Query, 
        filter: {
            texts: string[], 
            categories: string[],
            bookId: number, 
            startMoralityNumber: number,
            endMoralityNumber: number,
            isRanking: boolean
        }
    ): void => {
         if (filter) {
            const { bookId, startMoralityNumber, endMoralityNumber, isRanking, texts, categories } = filter;
            let queryJson: {[key: string]: any} = {};
            queryJson = {
                ...queryJson,
                book_id: bookId,
                morality_num: `[${startMoralityNumber} TO ${endMoralityNumber}]`
            }
    
            if(isRanking) {
                bookQuery.sort({tripitaka_id: "ASC"}).sort({morality_num: "ASC"})
            }
    
            this.setArrayStringFilterOR(categories, 'category', 'OR', queryJson);
    
            this.setArrayStringFilterOR(texts, 'text', 'AND', queryJson);
            
            bookQuery.q(queryJson);
        } else {
            bookQuery.q("*:*");
        }
    }

    private static setArrayStringFilterOR = (texts: string[], fieldName: string, conditionType: string, queryJson: {[k: string]: any}): void => {
        if(texts.length > 0) {
            let queryText = '';
            texts.forEach((text: string) => {
                queryText += `${text} ${conditionType} `;
            });
            queryText = queryText.slice(0, -(conditionType.length + 1));
            queryJson[fieldName] = `( ${queryText} )`;
        }
    }

}

export default Service